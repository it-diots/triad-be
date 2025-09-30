import { Injectable, Logger } from '@nestjs/common';

import { JoinProjectDto } from '../types/collaboration.types';
import {
  SessionData,
  SessionInfo,
  SessionStateInfo,
  SessionStats,
  SessionUpdateData,
  SessionValidationResult,
} from '../types/session.handler.types';

/**
 * 세션 관련 순수 비즈니스 로직을 처리하는 핸들러
 */
@Injectable()
export class SessionHandler {
  private readonly logger = new Logger(SessionHandler.name);

  /**
   * 세션 ID 생성
   * @param projectId - 프로젝트 ID
   * @param userId - 사용자 ID
   * @returns 생성된 세션 ID
   */
  generateSessionId(projectId?: string, userId?: string): string {
    try {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2);

      let sessionId: string;

      if (projectId && userId) {
        // 프로젝트와 사용자 기반 세션 ID
        sessionId = `session_${projectId.substring(0, 8)}_${userId.substring(0, 8)}_${timestamp}_${random}`;
      } else {
        // 일반 세션 ID
        sessionId = `session_${timestamp}_${random}`;
      }

      this.logger.debug(`세션 ID 생성: ${sessionId}`);
      return sessionId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `세션 ID 생성 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      // 오류 시 기본 형태 반환
      return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }
  }

  /**
   * 세션 데이터 준비
   * @param projectId - 프로젝트 ID
   * @param userId - 사용자 ID
   * @param userInfo - 사용자 정보
   * @returns 세션 생성용 데이터
   */
  prepareSessionData(projectId: string, userId: string, userInfo: JoinProjectDto): SessionData {
    try {
      const now = new Date();

      const sessionData: SessionData = {
        projectId,
        userId,
        username: userInfo.username || `user_${userId.substring(0, 8)}`,
        userEmail: userInfo.userEmail || userInfo.email,
        userAvatar: userInfo.userAvatar || userInfo.avatar,
        isActive: true,
        joinedAt: now,
        lastActivity: now,
        cursorPosition: undefined, // 초기 커서 위치는 나중에 업데이트됨
      };

      this.logger.debug(
        `세션 데이터 준비: 프로젝트=${projectId}, 사용자=${userId} (${sessionData.username})`,
      );

      return sessionData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `세션 데이터 준비 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }

  /**
   * 세션 상태 검증
   * @param session - 세션 정보
   * @returns 세션 유효성 검사 결과
   */
  validateSessionState(session: SessionStateInfo): SessionValidationResult {
    try {
      const now = new Date();

      // 세션이 비활성 상태인 경우
      if (!session.isActive) {
        this.logger.debug('세션 검증: 비활성 상태');
        return { isValid: false, reason: 'inactive' };
      }

      // 마지막 활동 시간 확인 (24시간 초과 시 만료)
      const hoursSinceLastActivity =
        (now.getTime() - session.lastActivity.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastActivity > 24) {
        this.logger.debug(`세션 검증: 만료됨 (${hoursSinceLastActivity.toFixed(1)}시간 비활성)`);
        return { isValid: false, reason: 'expired', shouldCleanup: true };
      }

      // 참가 시간이 미래인 경우 (시스템 시간 오류)
      if (session.joinedAt > now) {
        this.logger.warn('세션 검증: 참가 시간이 미래');
        return { isValid: false, reason: 'invalid_join_time' };
      }

      // 마지막 활동이 참가 시간보다 이전인 경우
      if (session.lastActivity < session.joinedAt) {
        this.logger.warn('세션 검증: 마지막 활동이 참가 시간보다 이전');
        return { isValid: false, reason: 'invalid_activity_time' };
      }

      this.logger.debug('세션 검증: 유효한 세션');
      return { isValid: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `세션 상태 검증 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      return { isValid: false, reason: 'validation_error' };
    }
  }

  /**
   * 세션 만료 시간 계산
   * @param joinedAt - 참가 시간
   * @param inactiveHours - 비활성 허용 시간 (기본값: 24시간)
   * @returns 만료 시간
   */
  calculateSessionExpiry(joinedAt: Date, inactiveHours: number = 24): Date {
    try {
      const expiryTime = new Date(joinedAt);
      expiryTime.setHours(expiryTime.getHours() + inactiveHours);

      this.logger.debug(
        `세션 만료 시간 계산: 참가=${joinedAt.toISOString()}, 만료=${expiryTime.toISOString()} (${inactiveHours}시간 후)`,
      );

      return expiryTime;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `세션 만료 시간 계산 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      // 오류 시 현재 시간 + 기본 시간 반환
      const fallbackExpiry = new Date();
      fallbackExpiry.setHours(fallbackExpiry.getHours() + inactiveHours);
      return fallbackExpiry;
    }
  }

  /**
   * 세션 업데이트 데이터 준비
   * @param userInfo - 업데이트할 사용자 정보
   * @param cursorPosition - 커서 위치 (선택사항)
   * @returns 업데이트용 데이터
   */
  prepareSessionUpdateData(
    userInfo?: JoinProjectDto,
    cursorPosition?: { x: number; y: number },
  ): SessionUpdateData {
    try {
      const updateData = this.createBaseUpdateData();

      // 사용자 정보 업데이트
      this.applyUserInfoToUpdateData(updateData, userInfo);

      // 커서 위치 업데이트
      this.applyCursorPositionToUpdateData(updateData, cursorPosition);

      this.logger.debug(`세션 업데이트 데이터 준비: ${Object.keys(updateData).length}개 필드`);
      return updateData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `세션 업데이트 데이터 준비 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      return this.createBaseUpdateData();
    }
  }

  /**
   * 프로젝트 기본 설정 생성
   * @returns 기본 프로젝트 설정
   */
  createDefaultProjectSettings(): Record<string, unknown> {
    try {
      const defaultSettings = {
        allowComments: true,
        allowGuests: true,
        isPublic: true,
        maxCollaborators: 50,
        enableRealTimeSync: true,
        enableMouseTracking: true,
        enableNotifications: true,
        sessionTimeout: 24, // 시간 단위
        autoCleanup: true,
      };

      this.logger.debug(`프로젝트 기본 설정 생성: ${Object.keys(defaultSettings).length}개 설정`);
      return defaultSettings;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `프로젝트 기본 설정 생성 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      // 오류 시 최소한의 설정 반환
      return {
        allowComments: true,
        isPublic: true,
        enableRealTimeSync: true,
      };
    }
  }

  /**
   * 프로젝트 ID 기반 프로젝트명 생성
   * @param projectId - 프로젝트 ID
   * @returns 생성된 프로젝트명
   */
  generateProjectName(projectId: string): string {
    try {
      // UUID 형식인지 확인
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (uuidPattern.test(projectId)) {
        const shortId = projectId.substring(0, 8);
        const projectName = `프로젝트 ${shortId}`;
        this.logger.debug(`UUID 기반 프로젝트명 생성: ${projectId} -> ${projectName}`);
        return projectName;
      }

      // URL 형식인지 확인
      if (projectId.startsWith('http')) {
        try {
          const url = new URL(projectId);
          const hostname = url.hostname.replace(/^www\./, ''); // www. 제거
          const projectName = `${hostname} 프로젝트`;
          this.logger.debug(`URL 기반 프로젝트명 생성: ${projectId} -> ${projectName}`);
          return projectName;
        } catch {
          const defaultName = '웹사이트 프로젝트';
          this.logger.warn(`URL 파싱 실패, 기본명 사용: ${projectId} -> ${defaultName}`);
          return defaultName;
        }
      }

      // 일반 ID인 경우
      const projectName =
        projectId.length > 20
          ? `프로젝트 ${projectId.substring(0, 20)}...`
          : `프로젝트 ${projectId}`;
      this.logger.debug(`일반 ID 기반 프로젝트명 생성: ${projectId} -> ${projectName}`);
      return projectName;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `프로젝트명 생성 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      // 오류 시 기본 이름 반환
      return '새 프로젝트';
    }
  }

  /**
   * 세션 통계 계산
   * @param sessions - 세션 목록
   * @returns 세션 통계
   */
  calculateSessionStats(sessions: SessionInfo[]): SessionStats {
    try {
      const total = sessions.length;
      const active = sessions.filter((s) => s.isActive).length;
      const inactive = total - active;
      const activeSessions = sessions.filter((s) => s.isActive);

      const averageSessionDuration = this.calculateAverageSessionDuration(activeSessions);
      const { oldestActiveSession, newestActiveSession } =
        this.findOldestAndNewestSessions(activeSessions);

      const stats: SessionStats = {
        total,
        active,
        inactive,
        averageSessionDuration,
        oldestActiveSession,
        newestActiveSession,
      };

      this.logger.debug(
        `세션 통계 계산: 전체=${total}, 활성=${active}, 비활성=${inactive}, 평균지속=${stats.averageSessionDuration}분`,
      );

      return stats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `세션 통계 계산 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      return this.createDefaultSessionStats();
    }
  }

  /**
   * 기본 업데이트 데이터 생성
   */
  private createBaseUpdateData(): SessionUpdateData {
    return {
      lastActivity: new Date(),
      isActive: true,
    };
  }

  /**
   * 사용자 정보를 업데이트 데이터에 적용
   */
  private applyUserInfoToUpdateData(
    updateData: SessionUpdateData,
    userInfo?: JoinProjectDto,
  ): void {
    if (!userInfo) {
      return;
    }

    if (userInfo.username) {
      updateData.username = userInfo.username;
    }
    if (userInfo.userEmail || userInfo.email) {
      updateData.userEmail = userInfo.userEmail || userInfo.email;
    }
    if (userInfo.userAvatar || userInfo.avatar) {
      updateData.userAvatar = userInfo.userAvatar || userInfo.avatar;
    }
  }

  /**
   * 커서 위치를 업데이트 데이터에 적용
   */
  private applyCursorPositionToUpdateData(
    updateData: SessionUpdateData,
    cursorPosition?: { x: number; y: number },
  ): void {
    if (cursorPosition) {
      updateData.cursorPosition = cursorPosition;
    }
  }

  /**
   * 평균 세션 지속 시간 계산
   */
  private calculateAverageSessionDuration(activeSessions: Array<{ joinedAt: Date }>): number {
    if (activeSessions.length === 0) {
      return 0;
    }

    const now = new Date();
    const durations = activeSessions.map(
      (s) => (now.getTime() - s.joinedAt.getTime()) / (1000 * 60),
    );
    const averageDuration =
      durations.reduce((sum, duration) => sum + duration, 0) / durations.length;

    return Math.round(averageDuration);
  }

  /**
   * 가장 오래된/새로운 활성 세션 찾기
   */
  private findOldestAndNewestSessions(activeSessions: Array<{ joinedAt: Date }>): {
    oldestActiveSession?: Date;
    newestActiveSession?: Date;
  } {
    if (activeSessions.length === 0) {
      return {};
    }

    const joinTimes = activeSessions.map((s) => s.joinedAt);
    return {
      oldestActiveSession: new Date(Math.min(...joinTimes.map((t) => t.getTime()))),
      newestActiveSession: new Date(Math.max(...joinTimes.map((t) => t.getTime()))),
    };
  }

  /**
   * 기본 세션 통계 생성
   */
  private createDefaultSessionStats(): SessionStats {
    return {
      total: 0,
      active: 0,
      inactive: 0,
      averageSessionDuration: 0,
    };
  }
}
