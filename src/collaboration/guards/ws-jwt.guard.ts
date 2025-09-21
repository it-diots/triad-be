import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const authHeader = client.handshake.headers.authorization;

      if (!authHeader) {
        throw new WsException('No authorization header');
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        throw new WsException('No token provided');
      }

      const payload = await this.jwtService.verifyAsync<Record<string, unknown>>(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const data = context.switchToWs().getData<{ user?: Record<string, unknown> }>();
      data.user = payload;
      return true;
    } catch {
      throw new WsException('Invalid token');
    }
  }
}
