import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../../users/users.service';
import { AuthProvider, User } from '../../users/entities/user.entity';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL', 'http://localhost:3000/auth/github/callback'),
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: Function,
  ): Promise<User> {
    const { id, username, displayName, photos, emails } = profile;
    
    const userProfile = {
      email: emails?.[0]?.value || '',
      provider: AuthProvider.GITHUB,
      providerId: id,
      username: username || emails?.[0]?.value?.split('@')[0] || `github_${id}`,
      firstName: displayName?.split(' ')[0],
      lastName: displayName?.split(' ').slice(1).join(' '),
      avatar: photos?.[0]?.value,
      providerData: {
        accessToken,
        refreshToken,
        profile,
      },
    };

    const user = await this.usersService.createOAuthUser(userProfile);
    done(null, user);
    return user;
  }
}