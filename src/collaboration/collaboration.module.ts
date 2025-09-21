import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { CollaborationController } from './collaboration.controller';
import { CollaborationGateway } from './collaboration.gateway';
import { CollaborationService } from './collaboration.service';
import { CommentHelper } from './helpers/comment.helper';
import { SessionHelper } from './helpers/session.helper';
import { CommentService } from './services/comment.service';
import { MouseTrackingService } from './services/mouse-tracking.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
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
  controllers: [CollaborationController],
  providers: [
    CollaborationGateway,
    CollaborationService,
    MouseTrackingService,
    CommentService,
    CommentHelper,
    SessionHelper,
  ],
  exports: [CollaborationGateway, CollaborationService, MouseTrackingService],
})
export class CollaborationModule {}
