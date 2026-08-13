import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService, AuthTokens } from './auth.service';
import { LoginDto, OAuthLoginDto, RefreshTokenDto, RegisterDto } from './dto/auth.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private setAuthCookies(res: Response, tokens: AuthTokens) {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';

    // Access Token Cookie (1 hour)
    res.cookie('qstack_access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    // Refresh Token Cookie (7-day sliding window)
    res.cookie('qstack_refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearAuthCookies(res: Response) {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    res.clearCookie('qstack_access_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });
    res.clearCookie('qstack_refresh_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });
  }

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.register(dto);
    this.setAuthCookies(res, tokens);
    return tokens;
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(dto);
    this.setAuthCookies(res, tokens);
    return tokens;
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('oauth')
  async oauthLogin(
    @Body() dto: OAuthLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.oauthLogin(dto);
    this.setAuthCookies(res, tokens);
    return tokens;
  }

  // Google OAuth Routes
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth2 login flow
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const authTokens = req.user as AuthTokens;
    this.setAuthCookies(res, authTokens);
    const clientUrl = this.configService.get<string>('CLIENT_URL', 'http://localhost:5173');
    return res.redirect(
      `${clientUrl}/auth/callback?token=${authTokens.accessToken}&refreshToken=${authTokens.refreshToken}`,
    );
  }

  // GitHub OAuth Routes
  @Public()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Initiates GitHub OAuth2 login flow
  }

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req: Request, @Res() res: Response) {
    const authTokens = req.user as AuthTokens;
    this.setAuthCookies(res, authTokens);
    const clientUrl = this.configService.get<string>('CLIENT_URL', 'http://localhost:5173');
    return res.redirect(
      `${clientUrl}/auth/callback?token=${authTokens.accessToken}&refreshToken=${authTokens.refreshToken}`,
    );
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refreshToken(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.['qstack_refresh_token'] || dto.refreshToken;
    if (!token) {
      throw new UnauthorizedException('Refresh token is required.');
    }
    const tokens = await this.authService.refreshToken(token);
    this.setAuthCookies(res, tokens);
    return tokens;
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    this.clearAuthCookies(res);
    return { success: true, message: 'Logged out successfully.' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser('userId') userId: string) {
    return this.authService.getMe(userId);
  }
}
