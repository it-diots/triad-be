import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';

import { CollaborationController } from './collaboration.controller';
import { CollaborationGateway } from './collaboration.gateway';
import { CollaborationService } from './collaboration.service';
import { CommentThread } from './entities/comment-thread.entity';
import { Comment } from './entities/comment.entity';
import { Mutation } from './entities/mutation.entity';
import { ProjectSession } from './entities/project-session.entity';
import { Project } from './entities/project.entity';
import { CommentService } from './services/comment.service';
import { MouseTrackingService } from './services/mouse-tracking.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Comment, CommentThread, Mutation, ProjectSession]),
    UsersModule,
    EventEmitterModule.forRoot(),
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
  controllers: [CollaborationController],
  providers: [CollaborationGateway, CollaborationService, MouseTrackingService, CommentService],
  exports: [CollaborationGateway, CollaborationService, MouseTrackingService],
})
export class CollaborationModule {}
