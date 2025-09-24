import { Controller, Get, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response, Request } from 'express';

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
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth 로그인' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  async googleAuth(): Promise<void> {
    // Guard redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiExcludeEndpoint()
  async googleAuthCallback(@Req() req: AuthRequest, @Res() res: Response): Promise<void> {
    const tokens = await this.authService.generateTokens(req.user);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');

    // 프론트엔드로 토큰과 함께 리다이렉트
    const redirectUrl =
      `${frontendUrl}/auth/callback?` +
      `accessToken=${tokens.accessToken}&` +
      `refreshToken=${tokens.refreshToken}&` +
      `provider=google`;

    res.redirect(HttpStatus.FOUND, redirectUrl);
  }

  @Public()
  @Get('github')
  @UseGuards(GitHubAuthGuard)
  @ApiOperation({ summary: 'GitHub OAuth 로그인' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub OAuth' })
  async githubAuth(): Promise<void> {
    // Guard redirects to GitHub
  }

  @Public()
  @Get('github/callback')
  @UseGuards(GitHubAuthGuard)
  @ApiExcludeEndpoint()
  async githubAuthCallback(@Req() req: AuthRequest, @Res() res: Response): Promise<void> {
    const tokens = await this.authService.generateTokens(req.user);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');

    // 프론트엔드로 토큰과 함께 리다이렉트
    const redirectUrl =
      `${frontendUrl}/auth/callback?` +
      `accessToken=${tokens.accessToken}&` +
      `refreshToken=${tokens.refreshToken}&` +
      `provider=github`;

    res.redirect(HttpStatus.FOUND, redirectUrl);
  }
}
