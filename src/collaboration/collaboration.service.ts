import { Injectable, Logger } from '@nestjs/common';

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
  private activeSessions: Map<string, Map<string, ProjectSession>> = new Map(); // projectId -> userId -> session

  constructor(
    private readonly mouseTrackingService: MouseTrackingService,
    private readonly commentService: CommentService,
  ) {}

  /**
   * 프로젝트에 사용자 참가
   */
  joinProject(
    projectId: string,
    userId: string,
    userInfo: JoinProjectDto,
  ): Promise<{ success: boolean; projectId: string; sessionId: string }> {
    try {
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 프로젝트 세션 초기화
      if (!this.activeSessions.has(projectId)) {
        this.activeSessions.set(projectId, new Map());
      }

      const projectSessions = this.activeSessions.get(projectId);
      if (!projectSessions) {
        throw new Error('Failed to get project sessions');
      }

      // 사용자 세션 생성
      const session: ProjectSession = {
        id: sessionId,
        projectId,
        userId,
        username: userInfo.username,
        userEmail: userInfo.userEmail,
        userAvatar: userInfo.userAvatar,
        joinedAt: new Date(),
        lastActivity: new Date(),
        isActive: true,
        cursorPosition: null,
      };

      projectSessions.set(userId, session);

      this.logger.log(`사용자 ${userId}가 프로젝트 ${projectId}에 참가했습니다`);

      return {
        success: true,
        projectId,
        channelName: `project:${projectId}`,
        sessionId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`프로젝트 참가 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 프로젝트에서 사용자 퇴장
   */
  leaveProject(projectId: string, userId: string): void {
    try {
      const projectSessions = this.activeSessions.get(projectId);

      if (projectSessions) {
        const session = projectSessions.get(userId);
        if (session) {
          session.isActive = false;
          session.lastActivity = new Date();
        }
        projectSessions.delete(userId);

        // 빈 프로젝트 정리
        if (projectSessions.size === 0) {
          this.activeSessions.delete(projectId);
        }
      }

      // 마우스 추적 클린업
      this.mouseTrackingService.cleanupUser(userId, projectId);

      this.logger.log(`사용자 ${userId}가 프로젝트 ${projectId}에서 퇴장했습니다`);
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
  ): Promise<{ success: boolean; projectId: string; sessionId: string }> {
    // URL을 프로젝트 ID로 변환 (해시 또는 인코딩)
    const projectId = this.urlToProjectId(url);
    return this.joinProject(projectId, userId, userInfo);
  }

  /**
   * 커서 위치 업데이트
   */
  async updateCursorPosition(
    projectId: string,
    userId: string,
    username: string,
    cursorData: UpdateCursorDto,
  ): Promise<void> {
    try {
      const projectSessions = this.activeSessions.get(projectId);

      if (projectSessions) {
        const session = projectSessions.get(userId);
        if (session) {
          session.cursorPosition = cursorData.position;
          session.lastActivity = new Date();
        }
      }

      // 실시간 마우스 추적 서비스 사용
      await this.mouseTrackingService.updateMousePosition(projectId, {
        userId,
        username,
        position: cursorData.position,
        color: cursorData.color,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`커서 위치 업데이트 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 배치 마우스 위치 업데이트
   */
  async updateMouseBatch(
    projectId: string,
    userId: string,
    username: string,
    trailData: MouseTrailDto,
  ): Promise<void> {
    try {
      await this.mouseTrackingService.updateMouseBatch(projectId, {
        userId,
        username,
        positions: trailData.trail,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`배치 마우스 업데이트 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 마우스 클릭 이벤트 처리
   */
  async handleMouseClick(
    projectId: string,
    options: {
      userId: string;
      username: string;
      position: MousePosition;
      clickType: 'left' | 'right' | 'middle';
    },
  ): Promise<void> {
    try {
      await this.mouseTrackingService.handleMouseClick(projectId, {
        userId: options.userId,
        username: options.username,
        position: options.position,
        clickType: options.clickType,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`마우스 클릭 처리 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 사용자 유휴/활성 상태 업데이트
   */
  async updateUserActivity(projectId: string, userId: string, isActive: boolean): Promise<void> {
    try {
      if (isActive) {
        await this.mouseTrackingService.setUserActive(projectId, userId);
      } else {
        await this.mouseTrackingService.setUserIdle(projectId, userId);
      }

      const projectSessions = this.activeSessions.get(projectId);
      if (projectSessions) {
        const session = projectSessions.get(userId);
        if (session) {
          session.isActive = isActive;
          session.lastActivity = new Date();
        }
      }
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
   * 프로젝트의 활성 세션 조회
   */
  getActiveSessions(projectId: string): ProjectSession[] {
    try {
      const projectSessions = this.activeSessions.get(projectId);

      if (!projectSessions) {
        return [];
      }

      return Array.from(projectSessions.values()).filter((session) => session.isActive);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`세션 조회 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * URL을 프로젝트 ID로 변환
   */
  private urlToProjectId(url: string): string {
    // URL을 안전한 프로젝트 ID로 변환
    // 간단한 예: URL의 해시값 사용
    // URL의 base64 인코딩을 사용한 안전한 프로젝트 ID 생성
    return Buffer.from(url)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 16);
  }

  /**
   * 모든 활성 세션 정리
   */
  cleanupAllSessions(): void {
    this.activeSessions.clear();
    this.logger.log('모든 세션이 정리되었습니다');
  }
}
