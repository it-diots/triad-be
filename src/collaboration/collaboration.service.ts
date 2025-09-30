import { createHash } from 'crypto';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CommentThreadResponseDto, ProjectSessionResponseDto } from '../common/dto/response.dto';
import { TransformUtil } from '../common/utils/transform.util';

import { CreateCommentThreadDto } from './dto/create-comment-thread.dto';
import { CreateMutationDto } from './dto/create-mutation.dto';
import { CommentThread } from './entities/comment-thread.entity';
import { Comment as CommentEntity } from './entities/comment.entity';
import { Mutation } from './entities/mutation.entity';
import { ProjectSession as ProjectSessionEntity } from './entities/project-session.entity';
import { Project } from './entities/project.entity';
import { CommentService } from './services/comment.service';
import { MouseTrackingService } from './services/mouse-tracking.service';
import {
  Comment,
  CreateCommentDto,
  JoinProjectDto,
  MousePosition,
  MouseTrailDto,
  ProjectSession,
  UpdateCursorDto,
} from './types/collaboration.types';

@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectSessionEntity)
    private readonly sessionRepository: Repository<ProjectSessionEntity>,
    @InjectRepository(CommentThread)
    private readonly commentThreadRepository: Repository<CommentThread>,
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(Mutation)
    private readonly mutationRepository: Repository<Mutation>,
    private readonly mouseTrackingService: MouseTrackingService,
    private readonly commentService: CommentService,
  ) {}

  /**
   * 프로젝트에 사용자 참가
   */
  async joinProject(
    projectId: string,
    userId: string,
    userInfo: JoinProjectDto,
  ): Promise<{ success: boolean; projectId: string; channelName: string; sessionId: string }> {
    try {
      await this.ensureProjectExists(projectId, userId);
      const session = await this.createOrUpdateSession(projectId, userId, userInfo);

      this.logger.log(`사용자 ${userId}가 프로젝트 ${projectId}에 참가했습니다`);

      return Promise.resolve({
        success: true,
        projectId,
        channelName: `project:${projectId}`,
        sessionId: session.id,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`프로젝트 참가 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 프로젝트에서 사용자 퇴장
   */
  async leaveProject(projectId: string, userId: string): Promise<void> {
    try {
      const session = await this.sessionRepository.findOne({
        where: { projectId, userId },
      });

      if (session) {
        session.isActive = false;
        session.lastActivity = new Date();
        await this.sessionRepository.save(session);
      }

      // 마우스 추적 클린업
      this.mouseTrackingService.cleanupUser(userId, projectId);

      this.logger.log(`사용자 ${userId}가 프로젝트 ${projectId}에서 퇴장했습니다`);
      return Promise.resolve();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`프로젝트 퇴장 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * URL 기반 프로젝트에 사용자 참가 (Chrome Extension용)
   */
  joinUrlProject(
    url: string,
    userId: string,
    userInfo: JoinProjectDto,
  ): Promise<{ success: boolean; projectId: string; channelName: string; sessionId: string }> {
    // URL을 프로젝트 ID로 변환 (해시 또는 인코딩)
    const projectId = this.urlToProjectId(url);
    return this.joinProject(projectId, userId, userInfo);
  }

  /**
   * 커서 위치 업데이트
   */
  updateCursorPosition(
    projectId: string,
    userId: string,
    username: string,
    cursorData: UpdateCursorDto,
  ): Promise<void> {
    try {
      // 세션 업데이트
      void this.sessionRepository.update(
        { projectId, userId },
        {
          cursorPosition: cursorData.position,
          lastActivity: new Date(),
        },
      );

      // 실시간 마우스 추적 서비스 사용
      void this.mouseTrackingService.updateMousePosition(projectId, {
        userId,
        username,
        position: cursorData.position,
        color: cursorData.color,
      });
      return Promise.resolve();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`커서 위치 업데이트 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 배치 마우스 위치 업데이트
   */
  updateMouseBatch(
    projectId: string,
    userId: string,
    username: string,
    trailData: MouseTrailDto,
  ): Promise<void> {
    try {
      void this.mouseTrackingService.updateMouseBatch(projectId, {
        userId,
        username,
        positions: trailData.trail,
      });
      return Promise.resolve();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`배치 마우스 업데이트 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 마우스 클릭 이벤트 처리
   */
  handleMouseClick(
    projectId: string,
    options: {
      userId: string;
      username: string;
      position: MousePosition;
      clickType: 'left' | 'right' | 'middle';
    },
  ): Promise<void> {
    try {
      void this.mouseTrackingService.handleMouseClick(projectId, {
        userId: options.userId,
        username: options.username,
        position: options.position,
        clickType: options.clickType,
      });
      return Promise.resolve();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`마우스 클릭 처리 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 사용자 유휴/활성 상태 업데이트
   */
  updateUserActivity(projectId: string, userId: string, isActive: boolean): Promise<void> {
    try {
      if (isActive) {
        void this.mouseTrackingService.setUserActive(projectId, userId);
      } else {
        void this.mouseTrackingService.setUserIdle(projectId, userId);
      }

      // 세션 상태 업데이트
      void this.sessionRepository.update(
        { projectId, userId },
        {
          isActive,
          lastActivity: new Date(),
        },
      );
      return Promise.resolve();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`사용자 활동 상태 업데이트 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 코멘트 생성
   */
  createComment(
    projectId: string,
    userId: string,
    username: string,
    data: CreateCommentDto,
  ): Promise<Comment> {
    return this.commentService.createComment(projectId, userId, username, data);
  }

  /**
   * 코멘트 삭제
   */
  deleteComment(projectId: string, commentId: string, userId: string): Promise<void> {
    return this.commentService.deleteComment(projectId, commentId, userId);
  }

  /**
   * 코멘트 해결 상태 토글
   */
  toggleCommentResolved(projectId: string, commentId: string, userId: string): Promise<Comment> {
    return this.commentService.toggleCommentResolved(projectId, commentId, userId);
  }

  /**
   * 프로젝트의 모든 코멘트 조회
   */
  getProjectComments(projectId: string): Promise<Comment[]> {
    return this.commentService.getProjectComments(projectId);
  }

  /**
   * 프로젝트의 코멘트 스레드 조회
   */
  async getCommentThreads(projectId: string): Promise<CommentThread[]> {
    try {
      const threads = await this.commentThreadRepository.find({
        where: { projectId },
        relations: ['comments'],
        order: { createdAt: 'DESC' },
      });

      return threads;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`코멘트 스레드 조회 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 프로젝트의 활성 세션 조회
   */
  async getActiveSessions(projectId: string): Promise<ProjectSession[]> {
    try {
      const sessions = await this.sessionRepository.find({
        where: { projectId, isActive: true },
        relations: ['user'],
        order: { lastActivity: 'DESC' },
      });

      return Promise.resolve(
        sessions.map((session) => ({
          id: session.id,
          projectId: session.projectId,
          userId: session.userId,
          username: session.username,
          userEmail: session.userEmail,
          userAvatar: session.userAvatar,
          joinedAt: session.joinedAt,
          lastActivity: session.lastActivity,
          isActive: session.isActive,
          cursorPosition: session.cursorPosition || null,
          // Legacy fields
          project_id: session.projectId,
          user_id: session.userId,
          is_active: session.isActive,
          cursor_position: session.cursorPosition || undefined,
          joined_at: session.joinedAt.toISOString(),
          last_activity: session.lastActivity.toISOString(),
          created_at: session.createdAt.toISOString(),
          updated_at: session.updatedAt.toISOString(),
        })),
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`세션 조회 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 모든 활성 세션 정리
   */
  async cleanupAllSessions(): Promise<void> {
    await this.sessionRepository.update({}, { isActive: false });
    this.logger.log('모든 세션이 정리되었습니다');
  }

  /**
   * Mutation 처리 (협업 좌표 데이터 저장)
   */
  async processMutations(
    projectId: string,
    mutationData: CreateMutationDto,
  ): Promise<{ success: boolean; processedMutations: number }> {
    const processedMutations: Mutation[] = [];

    try {
      // 각 mutation 처리
      for (const mutation of mutationData.mutations) {
        // Mutation 엔티티 생성
        const mutationEntity = this.mutationRepository.create({
          projectId,
          userId: mutationData.profileID, // profileId를 userId로 매핑
          type: 'added', // 기본값 설정
          metadata: {
            clientId: mutationData.clientID,
            mutationId: mutation.id,
            mutationName: mutation.name,
            args: mutation.args,
            pushVersion: mutationData.pushVersion || 0,
            schemaVersion: mutationData.schemaVersion || '',
            status: 'pending',
          },
          timestamp: new Date(mutation.timestamp),
        });

        // createCommentThread mutation 처리
        if (mutation.name === 'createCommentThread' && mutation.args) {
          const threadData = mutation.args as unknown as CreateCommentThreadDto;
          await this.createCommentThreadWithCoordinates(projectId, threadData);
          // status를 metadata에 업데이트
          if (mutationEntity.metadata) {
            mutationEntity.metadata.status = 'processed';
          }
        }

        const savedMutation = await this.mutationRepository.save(mutationEntity);
        processedMutations.push(savedMutation);
      }

      return {
        success: true,
        processedMutations: processedMutations.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Mutation 처리 실패: ${errorMessage}`);
      throw error;
    }
  }

  // DTO 변환 메서드들
  /**
   * CommentThread 엔티티를 CommentThreadResponseDto로 변환
   */
  toCommentThreadResponseDto(thread: CommentThread): CommentThreadResponseDto {
    return TransformUtil.toCommentThreadResponseDto(thread);
  }

  /**
   * ProjectSession 엔티티를 ProjectSessionResponseDto로 변환
   */
  toProjectSessionResponseDto(session: ProjectSessionEntity): ProjectSessionResponseDto {
    return TransformUtil.toProjectSessionResponseDto(session);
  }

  /**
   * 코멘트 스레드 조회 후 DTO로 변환하여 반환
   */
  async getCommentThreadsAndTransform(projectId: string): Promise<CommentThreadResponseDto[]> {
    try {
      const threads = await this.commentThreadRepository.find({
        where: { projectId },
        relations: ['comments', 'comments.user', 'comments.resolver', 'resolver'],
        order: { createdAt: 'DESC' },
      });

      return threads.map((thread) => this.toCommentThreadResponseDto(thread));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`코멘트 스레드 조회 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 프로젝트 존재 확인 또는 생성
   */
  private async ensureProjectExists(projectId: string, userId: string): Promise<Project> {
    let project = await this.projectRepository.findOne({ where: { id: projectId } });

    if (!project) {
      project = this.projectRepository.create({
        id: projectId,
        name: `Project ${projectId}`,
        ownerId: userId,
        url: projectId.startsWith('http') ? projectId : undefined,
        settings: {
          allowComments: true,
          allowGuests: true,
          isPublic: true,
        },
      });
      await this.projectRepository.save(project);
    }

    return project;
  }

  /**
   * 세션 생성 또는 업데이트
   */
  private async createOrUpdateSession(
    projectId: string,
    userId: string,
    userInfo: JoinProjectDto,
  ): Promise<ProjectSessionEntity> {
    let session = await this.sessionRepository.findOne({ where: { projectId, userId } });

    if (session) {
      session.isActive = true;
      session.lastActivity = new Date();
      await this.sessionRepository.save(session);
    } else {
      session = this.sessionRepository.create({
        projectId,
        userId,
        username: userInfo.username,
        userEmail: userInfo.userEmail || userInfo.email,
        userAvatar: userInfo.userAvatar || userInfo.avatar,
        isActive: true,
        joinedAt: new Date(),
        lastActivity: new Date(),
      });
      await this.sessionRepository.save(session);
    }

    return session;
  }

  /**
   * URL을 프로젝트 ID로 변환
   */
  private urlToProjectId(url: string): string {
    const hash = createHash('sha256').update(url).digest();
    const bytes = Buffer.from(hash.subarray(0, 16));

    // Use UUIDv5 layout for deterministic project IDs
    bytes[6] = (bytes[6] & 0x0f) | 0x50; // set version to 5
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // set variant to RFC 4122

    const hex = bytes.toString('hex');
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
  }

  /**
   * 좌표 정보가 포함된 코멘트 스레드 생성
   */
  private async createCommentThreadWithCoordinates(
    projectId: string,
    threadData: CreateCommentThreadDto,
  ): Promise<CommentThread> {
    // Deployment functionality removed - no longer needed for Google Extension
    const savedThread = await this.createCommentThread(projectId, threadData);
    await this.createFirstComment(projectId, savedThread.id, threadData);

    return savedThread;
  }

  // Deployment functionality removed - no longer needed for Google Extension

  /**
   * 코멘트 스레드 생성
   */
  private createCommentThread(
    projectId: string,
    threadData: CreateCommentThreadDto,
  ): Promise<CommentThread> {
    const thread = this.commentThreadRepository.create({
      projectId,
      url: threadData.deploymentUrl || threadData.page,
      pageTitle: threadData.pageTitle,
      isResolved: false,
    });

    return this.commentThreadRepository.save(thread);
  }

  /**
   * 첫 번째 코멘트 생성
   */
  private async createFirstComment(
    projectId: string,
    threadId: string,
    threadData: CreateCommentThreadDto,
  ): Promise<void> {
    const comment = this.commentRepository.create({
      projectId,
      threadId,
      userId: 'system', // 실제 사용자 ID로 대체 필요
      body: threadData.firstComment.body,
      content: threadData.firstComment.text,
      images: threadData.firstComment.images,
      commitSha: threadData.firstComment.commitSha,
      href: threadData.firstComment.href,
      leftOnLocalhost: threadData.firstComment.leftOnLocalhost,
      deploymentId: threadData.firstComment.deployment?.id || undefined, // deployment 객체에서 id 추출
      position: { x: threadData.x, y: threadData.y },
    });

    await this.commentRepository.save(comment);
  }
}
