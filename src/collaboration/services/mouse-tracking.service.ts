import { Injectable, Logger } from '@nestjs/common';

import { SupabaseService } from '../../supabase/supabase.service';
import {
  MousePosition,
  MousePath,
  CursorMoveEvent,
  MouseTrailEvent,
  REALTIME_EVENTS,
} from '../types/collaboration.types';

interface MouseTrackingState {
  lastPosition: MousePosition;
  lastUpdate: number;
  trail: MousePosition[];
  velocity: { dx: number; dy: number };
  isIdle: boolean;
  color: string;
}

@Injectable()
export class MouseTrackingService {
  private readonly logger = new Logger(MouseTrackingService.name);
  private readonly userStates: Map<string, MouseTrackingState> = new Map();
  private readonly mousePaths: Map<string, MousePath> = new Map();

  // 성능 최적화 설정
  private readonly THROTTLE_MS = 50; // 50ms 쓰로틀링
  private readonly BATCH_SIZE = 10; // 10개씩 배치 전송
  private readonly TRAIL_LENGTH = 20; // 최근 20개 위치 유지

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * 마우스 위치 업데이트 (쓰로틀링 적용)
   */
  async updateMousePosition(
    projectId: string,
    options: {
      userId: string;
      username: string;
      position: MousePosition;
      color?: string;
    },
  ): Promise<void> {
    const { userId, username, position, color } = options;
    const now = Date.now();
    const state = this.getUserState(userId, color);

    // 쓰로틀링 체크
    if (now - state.lastUpdate < this.THROTTLE_MS) {
      // 쓰로틀 기간 내에는 trail만 업데이트
      this.updateTrail(state, position);
      return;
    }

    // 속도 계산
    const velocity = this.calculateVelocity(state.lastPosition, position, now - state.lastUpdate);

    // 상태 업데이트
    state.lastPosition = position;
    state.lastUpdate = now;
    state.velocity = velocity;
    state.isIdle = false;
    this.updateTrail(state, position);

    // Realtime 브로드캐스트
    await this.broadcastCursorMove(projectId, {
      userId,
      username,
      position,
      velocity,
      color: state.color,
    });

    // 배치가 가득 찼으면 trail 브로드캐스트
    if (state.trail.length >= this.BATCH_SIZE) {
      await this.broadcastMouseTrail(projectId, userId, username, state.trail);
      state.trail = []; // 전송 후 초기화
    }

    // 경로 기록
    this.recordMousePath(projectId, userId, position);
  }

  /**
   * 배치 마우스 위치 업데이트 (여러 좌표를 한 번에)
   */
  async updateMouseBatch(
    projectId: string,
    options: {
      userId: string;
      username: string;
      positions: MousePosition[];
      color?: string;
    },
  ): Promise<void> {
    const { userId, username, positions, color } = options;
    if (positions.length === 0) {
      return;
    }

    const state = this.getUserState(userId, color);
    const lastPos = positions[positions.length - 1];

    // 마지막 위치로 상태 업데이트
    state.lastPosition = lastPos;
    state.lastUpdate = Date.now();
    state.isIdle = false;

    // Trail 업데이트
    positions.forEach((pos) => this.updateTrail(state, pos));

    // 배치 브로드캐스트
    const channel = this.supabaseService.getProjectChannel(projectId);
    await this.supabaseService.broadcastEvent(channel, REALTIME_EVENTS.CURSOR_BATCH, {
      user_id: userId,
      username,
      positions,
      color: state.color,
      timestamp: new Date().toISOString(),
    });

    // 경로 기록
    for (const pos of positions) {
      this.recordMousePath(projectId, userId, pos);
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
      clickType?: 'left' | 'right' | 'middle';
    },
  ): Promise<void> {
    const { userId, username, position, clickType = 'left' } = options;
    const channel = this.supabaseService.getProjectChannel(projectId);
    await this.supabaseService.broadcastEvent(channel, REALTIME_EVENTS.MOUSE_CLICK, {
      user_id: userId,
      username,
      position,
      click_type: clickType,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 유저 유휴 상태 처리
   */
  async setUserIdle(projectId: string, userId: string): Promise<void> {
    const state = this.userStates.get(userId);
    if (state) {
      state.isIdle = true;
    }

    const channel = this.supabaseService.getProjectChannel(projectId);
    await this.supabaseService.broadcastEvent(channel, REALTIME_EVENTS.USER_IDLE, {
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 유저 활성 상태 처리
   */
  async setUserActive(projectId: string, userId: string): Promise<void> {
    const state = this.userStates.get(userId);
    if (state) {
      state.isIdle = false;
    }

    const channel = this.supabaseService.getProjectChannel(projectId);
    await this.supabaseService.broadcastEvent(channel, REALTIME_EVENTS.USER_ACTIVE, {
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 저장된 마우스 경로 조회
   */
  getMousePath(projectId: string, userId: string): MousePath | null {
    const key = `${projectId}:${userId}`;
    const path = this.mousePaths.get(key);

    if (!path || path.path_data.length === 0) {
      return null;
    }

    return path;
  }

  /**
   * 모든 활성 유저의 마우스 상태 조회
   */
  getActiveUsers(_projectId: string): Map<string, MouseTrackingState> {
    const activeUsers = new Map<string, MouseTrackingState>();

    for (const [userId, state] of this.userStates) {
      if (!state.isIdle) {
        activeUsers.set(userId, state);
      }
    }

    return activeUsers;
  }

  /**
   * 유저 커서 색상 설정
   */
  setUserColor(userId: string, color: string): void {
    const state = this.userStates.get(userId);
    if (state) {
      state.color = color;
    }
  }

  /**
   * 클린업 - 유저 퇴장 시
   */
  cleanupUser(userId: string, projectId: string): void {
    this.userStates.delete(userId);
    const key = `${projectId}:${userId}`;
    const path = this.mousePaths.get(key);
    if (path) {
      path.is_active = false;
      path.end_time = new Date().toISOString();
    }
  }

  // Private 헬퍼 메소드들

  private getUserState(userId: string, color?: string): MouseTrackingState {
    let state = this.userStates.get(userId);
    if (!state) {
      state = {
        lastPosition: { x: 0, y: 0 },
        lastUpdate: 0,
        trail: [],
        velocity: { dx: 0, dy: 0 },
        isIdle: false,
        color: color || this.generateRandomColor(),
      };
      this.userStates.set(userId, state);
    }
    return state;
  }

  private updateTrail(state: MouseTrackingState, position: MousePosition): void {
    state.trail.push(position);
    if (state.trail.length > this.TRAIL_LENGTH) {
      state.trail.shift(); // 오래된 위치 제거
    }
  }

  private calculateVelocity(
    oldPos: MousePosition,
    newPos: MousePosition,
    deltaTime: number,
  ): { dx: number; dy: number } {
    if (deltaTime === 0) {
      return { dx: 0, dy: 0 };
    }

    return {
      dx: (newPos.x - oldPos.x) / deltaTime,
      dy: (newPos.y - oldPos.y) / deltaTime,
    };
  }

  private async broadcastCursorMove(
    projectId: string,
    data: {
      userId: string;
      username: string;
      position: MousePosition;
      velocity: { dx: number; dy: number };
      color: string;
    },
  ): Promise<void> {
    const { userId, username, position, velocity, color } = data;
    const event: CursorMoveEvent = {
      user_id: userId,
      username,
      position,
      velocity,
      color,
      timestamp: new Date().toISOString(),
    };

    const channel = this.supabaseService.getProjectChannel(projectId);
    await this.supabaseService.broadcastEvent(
      channel,
      REALTIME_EVENTS.CURSOR_MOVE,
      event as unknown as Record<string, unknown>,
    );
  }

  private async broadcastMouseTrail(
    projectId: string,
    userId: string,
    username: string,
    trail: MousePosition[],
  ): Promise<void> {
    const event: MouseTrailEvent = {
      user_id: userId,
      username,
      trail,
      timestamp: new Date().toISOString(),
    };

    const channel = this.supabaseService.getProjectChannel(projectId);
    await this.supabaseService.broadcastEvent(
      channel,
      REALTIME_EVENTS.MOUSE_TRAIL,
      event as unknown as Record<string, unknown>,
    );
  }

  private recordMousePath(projectId: string, userId: string, position: MousePosition): void {
    const key = `${projectId}:${userId}`;
    let path = this.mousePaths.get(key);

    if (!path) {
      path = {
        user_id: userId,
        project_id: projectId,
        path_data: [],
        start_time: new Date().toISOString(),
        is_active: true,
      };
      this.mousePaths.set(key, path);
    }

    path.path_data.push(position);

    // 경로가 너무 길어지면 DB에 저장하고 초기화
    if (path.path_data.length >= 100) {
      this.savePathToDatabase(path);
      path.path_data = []; // 저장 후 초기화
    }
  }

  private savePathToDatabase(path: MousePath): void {
    try {
      // mouse_paths 테이블이 있다면 저장 (선택적)
      // 현재는 메모리에서만 관리
      this.logger.log(`마우스 경로 저장: ${path.user_id} - ${path.path_data.length} points`);
    } catch (error) {
      this.logger.error('마우스 경로 저장 실패:', error);
    }
  }

  private generateRandomColor(): string {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFA07A',
      '#20B2AA',
      '#9370DB',
      '#FFD700',
      '#FF69B4',
      '#00CED1',
      '#FF8C00',
      '#7B68EE',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
