import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthRepository, UserRow } from './auth.repository';
import { LoginDto, OAuthLoginDto, RegisterDto } from './dto/auth.dto';
import { IEventBus } from '../../redis/event-bus.interface';
import { DatabaseService } from '../../database/database.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
    avatarUrl: string | null;
    reputation: number;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepo: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly db: DatabaseService,
    @Inject('IEventBus') private readonly eventBus: IEventBus,
  ) {}

  /**
   * Register a new user with email and password.
   */
  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.authRepo.findUserByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.authRepo.createUserWithLocalAuth(
      dto.email,
      passwordHash,
      dto.displayName,
    );

    // Track daily login and emit event
    await this.recordLogin(user.id);

    return this.generateTokens(user);
  }

  /**
   * Login with email and password.
   */
  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.authRepo.findUserByEmail(dto.email);
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.is_banned) {
      throw new UnauthorizedException('Your account has been suspended. Please contact support.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Track daily login & publish user.login event
    await this.recordLogin(user.id);

    return this.generateTokens(user);
  }

  /**
   * Handle OAuth login/registration for Google & GitHub.
   */
  async oauthLogin(dto: OAuthLoginDto): Promise<AuthTokens> {
    const user = await this.authRepo.findOrCreateOAuthUser(
      dto.provider,
      dto.providerUserId,
      dto.email,
      dto.displayName,
      dto.avatarUrl,
    );

    if (user.is_banned) {
      throw new UnauthorizedException('Your account has been suspended.');
    }

    await this.recordLogin(user.id);
    return this.generateTokens(user);
  }

  /**
   * Refresh JWT access token.
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const secret = this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        'dev-jwt-refresh-secret-qstack-2026-key',
      );
      const payload = this.jwtService.verify(refreshToken, { secret });

      const user = await this.authRepo.findUserById(payload.sub);
      if (!user || user.is_banned) {
        throw new UnauthorizedException('Session invalid or account suspended.');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
  }

  /**
   * Get currently authenticated user profile.
   */
  async getMe(userId: string) {
    const user = await this.authRepo.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const identitiesResult = await this.db.query(
      'SELECT provider, created_at FROM auth_identities WHERE user_id = $1',
      [userId],
    );

    return {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      role: user.role,
      reputation: user.reputation_total,
      identities: identitiesResult.rows,
      createdAt: user.created_at,
    };
  }

  /**
   * Record login into daily_active and publish user.login event.
   */
  private async recordLogin(userId: string): Promise<void> {
    try {
      // Idempotent upsert into daily_active
      await this.db.query(
        `INSERT INTO daily_active (user_id, date)
         VALUES ($1, CURRENT_DATE)
         ON CONFLICT (user_id, date) DO NOTHING`,
        [userId],
      );

      // Publish event to Redis Streams
      await this.eventBus.publish('auth', {
        type: 'user.login',
        userId,
        timestamp: new Date().toISOString(),
        payload: { userId },
      });
    } catch (error) {
      this.logger.warn(`Could not log login activity: ${(error as Error).message}`);
    }
  }

  /**
   * Generate JWT Access & Refresh Tokens.
   */
  private generateTokens(user: UserRow): AuthTokens {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessSecret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'dev-jwt-access-secret-qstack-2026-key',
    );
    const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');

    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'dev-jwt-refresh-secret-qstack-2026-key',
    );
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: accessExpiresIn as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn as any,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        avatarUrl: user.avatar_url,
        reputation: user.reputation_total,
      },
    };
  }
}
