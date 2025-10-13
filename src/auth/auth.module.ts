import { DynamicModule, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '../users/users.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OAuthController } from './oauth.controller';
import { GitHubStrategy } from './strategies/github.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({})
export class AuthModule {
  static register(): DynamicModule {
    const logger = new Logger('AuthModule');
    const providers: Array<
      | typeof AuthService
      | typeof LocalStrategy
      | typeof JwtStrategy
      | typeof JwtRefreshStrategy
      | typeof GoogleStrategy
      | typeof GitHubStrategy
    > = [AuthService, LocalStrategy, JwtStrategy, JwtRefreshStrategy];

    // Google OAuth 전략 조건부 추가
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      providers.push(GoogleStrategy);
      logger.log('Google OAuth 활성화됨');
    } else {
      logger.warn(
        'Google OAuth 비활성화: GOOGLE_CLIENT_ID 및 GOOGLE_CLIENT_SECRET 환경변수를 설정하세요',
      );
    }

    // GitHub OAuth 전략 조건부 추가
    if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
      providers.push(GitHubStrategy);
      logger.log('GitHub OAuth 활성화됨');
    } else {
      logger.warn(
        'GitHub OAuth 비활성화: GITHUB_CLIENT_ID 및 GITHUB_CLIENT_SECRET 환경변수를 설정하세요',
      );
    }

    if (providers.length === 4) {
      logger.warn('OAuth 로그인이 비활성화되어 있습니다. 일반 로그인만 사용 가능합니다.');
    }

    return {
      module: AuthModule,
      imports: [
        UsersModule,
        PassportModule,
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>('jwt.secret'),
            signOptions: {
              expiresIn: '15m',
            },
          }),
          inject: [ConfigService],
        }),
      ],
      controllers: [AuthController, OAuthController],
      providers,
      exports: [AuthService],
    };
  }
}
