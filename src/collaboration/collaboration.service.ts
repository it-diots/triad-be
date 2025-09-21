import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RealtimeChannel } from '@supabase/supabase-js';

import { SupabaseService } from '../supabase/supabase.service';
import { SessionHelper } from './helpers/session.helper';
import { CommentService } from './services/comment.service';
import { MouseTrackingService } from './services/mouse-tracking.service';
import {
  Comment,
  CreateCommentDto,
  JoinProjectDto,
  MousePosition,
  MouseTrailDto,
  PresenceState,
  ProjectSession,
  REALTIME_EVENTS,
  SUPABASE_TABLES,
  UpdateCursorDto,
} from './types/collaboration.types';

// Supabase 응답 타입 정의
interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);
  private activeChannels: Map<string, RealtimeChannel> = new Map();

  constructor(
    private readonly supabaseService: SupabaseService,
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
      await this.validateProjectExists(projectId);
      const sessionId = await SessionHelper.handleUserSession(
        this.supabaseService,
        projectId,
        userId,
        userInfo,
      );
      await this.setupRealtimeConnection(projectId, userId, userInfo);

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
  async leaveProject(projectId: string, userId: string): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();

      await supabase
        .from(SUPABASE_TABLES.PROJECT_SESSIONS)
        .update({
          is_active: false,
          last_activity: new Date().toISOString(),
        })
        .eq('project_id', projectId)
        .eq('user_id', userId);

      const channelName = `project:${projectId}`;
      const channel = this.activeChannels.get(channelName);

      if (channel) {
        await channel.untrack();
        await this.supabaseService.unsubscribeChannel(channelName);
        this.activeChannels.delete(channelName);
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
   * 커서 위치 업데이트 (향상된 실시간 추적)
   */
  async updateCursorPosition(
    projectId: string,
    userId: string,
    username: string,
    cursorData: UpdateCursorDto,
  ): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();

      // DB 업데이트 (간헐적으로만)
      await supabase
        .from(SUPABASE_TABLES.PROJECT_SESSIONS)
        .update({
          cursor_position: cursorData.position,
          last_activity: new Date().toISOString(),
        })
        .eq('project_id', projectId)
        .eq('user_id', userId);

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
  async getActiveSessions(projectId: string): Promise<ProjectSession[]> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data: sessions, error } = await supabase
        .from(SUPABASE_TABLES.PROJECT_SESSIONS)
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('joined_at', { ascending: false });

      if (error || !sessions) {
        throw new BadRequestException('세션 조회 실패');
      }

      return sessions as ProjectSession[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`세션 조회 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 모든 활성 채널 정리
   */
  async cleanupAllChannels(): Promise<void> {
    for (const [channelName, channel] of this.activeChannels) {
      await channel.untrack();
      await this.supabaseService.unsubscribeChannel(channelName);
    }
    this.activeChannels.clear();
    this.logger.log('모든 채널이 정리되었습니다');
  }

  /**
   * 프로젝트 존재 여부 확인
   */
  private async validateProjectExists(projectId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();
    const response = (await supabase
      .from(SUPABASE_TABLES.PROJECTS)
      .select('*')
      .eq('id', projectId)
      .single()) as SupabaseResponse<unknown>;

    if (response.error || !response.data) {
      throw new NotFoundException(`프로젝트를 찾을 수 없습니다: ${projectId}`);
    }
  }

  /**
   * Realtime 연결 설정
   */
  private async setupRealtimeConnection(
    projectId: string,
    userId: string,
    userInfo: JoinProjectDto,
  ): Promise<void> {
    const channel = this.setupProjectChannel(projectId);
    await this.trackUserPresence(channel, userId, userInfo);
  }

  /**
   * 프로젝트 채널 설정
   */
  private setupProjectChannel(projectId: string): RealtimeChannel {
    const channelName = `project:${projectId}`;

    let channel = this.activeChannels.get(channelName);
    if (channel) {
      return channel;
    }

    channel = this.supabaseService.getProjectChannel(projectId);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        this.logger.log(`Presence 동기화 - 프로젝트 ${projectId}:`, state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        this.logger.log(`사용자 참가 - ${key} in 프로젝트 ${projectId}`, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        this.logger.log(`사용자 퇴장 - ${key} from 프로젝트 ${projectId}`, leftPresences);
      });

    Object.values(REALTIME_EVENTS).forEach((eventName) => {
      channel.on('broadcast', { event: eventName }, ({ payload }) => {
        this.logger.log(`이벤트 수신 - ${eventName} in 프로젝트 ${projectId}:`, payload);
      });
    });

    channel.subscribe();
    this.activeChannels.set(channelName, channel);

    return channel;
  }

  /**
   * Presence 추적
   */
  private async trackUserPresence(
    channel: RealtimeChannel,
    userId: string,
    userInfo: JoinProjectDto,
  ): Promise<void> {
    const presenceState: PresenceState = {
      user_id: userId,
      username: userInfo.username,
      online_at: new Date().toISOString(),
      is_active: true,
    };

    await channel.track(presenceState);
  }
}
