import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import type { Observable } from 'rxjs';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  private readonly logger = new Logger(JwtRefreshGuard.name);

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    this.logger.log('JwtRefreshGuard canActivate 호출됨');
    const request = context.switchToHttp().getRequest<{ body: unknown }>();
    this.logger.log('Request body: ' + JSON.stringify(request.body));
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false,
    info: Error | undefined,
    _context: ExecutionContext,
  ): TUser {
    this.logger.error('JwtRefreshGuard handleRequest 호출됨');
    this.logger.error('Error: ' + JSON.stringify(err));
    this.logger.error('User: ' + JSON.stringify(user));
    this.logger.error('Info: ' + JSON.stringify(info));

    if (err || !user) {
      if (info) {
        this.logger.error('인증 실패 - Info message: ' + info.message);
        throw new UnauthorizedException({
          statusCode: 401,
          message: info.message || 'Refresh token validation failed',
          error: 'Unauthorized',
        });
      }
      throw err || new UnauthorizedException('Unauthorized');
    }
    return user;
  }
}
