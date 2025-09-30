import { MousePosition } from './collaboration.types';

/**
 * CollaborationService에서 사용하는 타입 정의
 */

/**
 * 프로젝트 참가 결과
 */
export interface JoinProjectResult {
  success: boolean;
  projectId: string;
  channelName: string;
  sessionId: string;
}

/**
 * 마우스 클릭 이벤트 옵션
 */
export interface MouseClickOptions {
  userId: string;
  username: string;
  position: MousePosition;
  clickType: 'left' | 'right' | 'middle';
}

/**
 * Legacy 형식의 세션 데이터
 */
export interface LegacyProjectSession {
  id: string;
  projectId: string;
  userId: string;
  username: string;
  userEmail: string | null | undefined;
  userAvatar: string | null | undefined;
  joinedAt: Date;
  lastActivity: Date;
  isActive: boolean;
  cursorPosition: MousePosition | null;
  // Legacy fields
  project_id: string;
  user_id: string;
  is_active: boolean;
  cursor_position?: MousePosition;
  joined_at: string;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

/**
 * Mutation 처리 결과
 */
export interface ProcessMutationsResult {
  success: boolean;
  processedMutations: number;
}

/**
 * Mutation 메타데이터
 */
export interface MutationMetadata extends Record<string, unknown> {
  clientId: string;
  mutationId: number;
  mutationName: string;
  args: unknown;
  pushVersion: number;
  schemaVersion: string;
  status: 'pending' | 'processed' | 'failed';
}
