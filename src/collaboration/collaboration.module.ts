import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';

import { CollaborationController } from './collaboration.controller';
import { CollaborationGateway } from './collaboration.gateway';
import { CollaborationService } from './collaboration.service';
import { CommentService } from './services/comment.service';
import { MouseTrackingService } from './services/mouse-tracking.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    EventEmitterModule.forRoot(),
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
  providers: [CollaborationGateway, CollaborationService, MouseTrackingService, CommentService],
  exports: [CollaborationGateway, CollaborationService, MouseTrackingService],
})
export class CollaborationModule {}
