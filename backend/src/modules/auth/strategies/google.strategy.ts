import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID') || 'placeholder_google_client_id';
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET') || 'placeholder_google_client_secret';
    const callbackURL = configService.get<string>(
      'GOOGLE_CALLBACK_URL',
      'http://localhost:4000/api/v1/auth/google/callback',
    );

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, displayName, emails, photos } = profile;
    const email = emails && emails.length > 0 ? emails[0].value : `${id}@google.oauth`;
    const avatarUrl = photos && photos.length > 0 ? photos[0].value : null;

    try {
      const authTokens = await this.authService.oauthLogin({
        provider: 'google',
        providerUserId: id,
        email,
        displayName: displayName || email.split('@')[0],
        avatarUrl,
      });
      done(null, authTokens);
    } catch (err) {
      done(err as Error, false);
    }
  }
}
