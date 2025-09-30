import {
  Controller,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeEndpoint, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { User } from '../users/entities/user.entity';

import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { GitHubAuthGuard } from './guards/github-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';

interface AuthRequest extends Request {
  user: User;
}

@ApiTags('OAuth')
@Controller('auth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth 로그인' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  googleAuth(): void {
    // Guard가 자동으로 Google OAuth로 리다이렉트
    this.logger.log('Google OAuth 로그인 시도');
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiExcludeEndpoint()
  async googleAuthCallback(@Req() req: AuthRequest, @Res() res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new InternalServerErrorException('OAuth 인증 실패: 사용자 정보를 가져올 수 없습니다');
      }

      this.logger.log(`Google OAuth 로그인 성공: ${req.user.email}`);

      const tokens = await this.authService.generateTokens(req.user);
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');

      // 프론트엔드로 토큰과 함께 리다이렉트
      const redirectUrl =
        `${frontendUrl}/auth/callback?` +
        `accessToken=${encodeURIComponent(tokens.accessToken)}&` +
        `refreshToken=${encodeURIComponent(tokens.refreshToken)}&` +
        `provider=google`;

      this.logger.log(`리다이렉트: ${frontendUrl}/auth/callback`);
      res.redirect(HttpStatus.FOUND, redirectUrl);
    } catch (error) {
      this.logger.error('Google OAuth 콜백 처리 실패', error);
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.redirect(
        HttpStatus.FOUND,
        `${frontendUrl}/auth/callback?error=${encodeURIComponent(errorMessage)}`,
      );
    }
  }

  @Public()
  @Get('github')
  @UseGuards(GitHubAuthGuard)
  @ApiOperation({ summary: 'GitHub OAuth 로그인' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub OAuth' })
  githubAuth(): void {
    // Guard가 자동으로 GitHub OAuth로 리다이렉트
    this.logger.log('GitHub OAuth 로그인 시도');
  }

  @Public()
  @Get('github/callback')
  @UseGuards(GitHubAuthGuard)
  @ApiExcludeEndpoint()
  async githubAuthCallback(@Req() req: AuthRequest, @Res() res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new InternalServerErrorException('OAuth 인증 실패: 사용자 정보를 가져올 수 없습니다');
      }

      this.logger.log(`GitHub OAuth 로그인 성공: ${req.user.email}`);

      const tokens = await this.authService.generateTokens(req.user);
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');

      // 프론트엔드로 토큰과 함께 리다이렉트
      const redirectUrl =
        `${frontendUrl}/auth/callback?` +
        `accessToken=${encodeURIComponent(tokens.accessToken)}&` +
        `refreshToken=${encodeURIComponent(tokens.refreshToken)}&` +
        `provider=github`;

      this.logger.log(`리다이렉트: ${frontendUrl}/auth/callback`);
      res.redirect(HttpStatus.FOUND, redirectUrl);
    } catch (error) {
      this.logger.error('GitHub OAuth 콜백 처리 실패', error);
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.redirect(
        HttpStatus.FOUND,
        `${frontendUrl}/auth/callback?error=${encodeURIComponent(errorMessage)}`,
      );
    }
  }
}
