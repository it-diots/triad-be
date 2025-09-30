import { Module, Logger } from '@nestjs/common';
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

/**
 * OAuth Provider를 동적으로 등록하는 함수
 * 환경변수가 설정된 경우에만 해당 Provider를 활성화
 */
const getOAuthProviders = (): Array<typeof GoogleStrategy | typeof GitHubStrategy> => {
  const logger = new Logger('AuthModule');
  const providers: Array<typeof GoogleStrategy | typeof GitHubStrategy> = [];

  // Google OAuth 활성화 체크
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(GoogleStrategy);
    logger.log('Google OAuth 활성화됨');
  } else {
    logger.warn(
      'Google OAuth 비활성화: GOOGLE_CLIENT_ID 및 GOOGLE_CLIENT_SECRET 환경변수를 설정하세요',
    );
  }

  // GitHub OAuth 활성화 체크
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.push(GitHubStrategy);
    logger.log('GitHub OAuth 활성화됨');
  } else {
    logger.warn(
      'GitHub OAuth 비활성화: GITHUB_CLIENT_ID 및 GITHUB_CLIENT_SECRET 환경변수를 설정하세요',
    );
  }

  if (providers.length === 0) {
    logger.warn('OAuth 로그인이 비활성화되어 있습니다. 일반 로그인만 사용 가능합니다.');
  }

  return providers;
};

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, OAuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    // OAuth 전략을 동적으로 추가
    ...getOAuthProviders(),
  ],
  exports: [AuthService],
})
export class AuthModule {}
