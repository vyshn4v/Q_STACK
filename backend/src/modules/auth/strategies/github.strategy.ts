import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = configService.get<string>('GITHUB_CLIENT_ID') || 'placeholder_github_client_id';
    const clientSecret = configService.get<string>('GITHUB_CLIENT_SECRET') || 'placeholder_github_client_secret';
    const callbackURL = configService.get<string>(
      'GITHUB_CALLBACK_URL',
      'http://localhost:4000/api/v1/auth/github/callback',
    );

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: (err: any, user?: any) => void,
  ): Promise<any> {
    const { id, username, displayName, emails, photos } = profile;
    const email =
      emails && emails.length > 0
        ? emails[0].value
        : `${username || id}@users.noreply.github.com`;
    const avatarUrl = photos && photos.length > 0 ? photos[0].value : null;

    try {
      const authTokens = await this.authService.oauthLogin({
        provider: 'github',
        providerUserId: String(id),
        email,
        displayName: displayName || username || `dev_${id}`,
        avatarUrl,
      });
      done(null, authTokens);
    } catch (err) {
      done(err as Error, false);
    }
  }
}
