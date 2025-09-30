/**
 * SessionHandler 관련 타입 정의
 */

/**
 * 세션 데이터
 */
export interface SessionData {
  /** 프로젝트 ID */
  projectId: string;
  /** 사용자 ID */
  userId: string;
  /** 사용자명 */
  username: string;
  /** 사용자 이메일 (선택사항) */
  userEmail?: string;
  /** 사용자 아바타 (선택사항) */
  userAvatar?: string;
  /** 활성 상태 */
  isActive: boolean;
  /** 참가 시간 */
  joinedAt: Date;
  /** 마지막 활동 시간 */
  lastActivity: Date;
  /** 커서 위치 (선택사항) */
  cursorPosition?: { x: number; y: number };
}

/**
 * 세션 상태 검증 결과
 */
export interface SessionValidationResult {
  /** 유효성 여부 */
  isValid: boolean;
  /** 무효 사유 (선택사항) */
  reason?: string;
  /** 정리 필요 여부 (선택사항) */
  shouldCleanup?: boolean;
}

/**
 * 세션 정보 (검증용)
 */
export interface SessionStateInfo {
  /** 활성 상태 */
  isActive: boolean;
  /** 마지막 활동 시간 */
  lastActivity: Date;
  /** 참가 시간 */
  joinedAt: Date;
}

/**
 * 세션 업데이트 데이터
 */
export interface SessionUpdateData {
  /** 마지막 활동 시간 */
  lastActivity: Date;
  /** 활성 상태 */
  isActive: boolean;
  /** 사용자명 (선택사항) */
  username?: string;
  /** 사용자 이메일 (선택사항) */
  userEmail?: string;
  /** 사용자 아바타 (선택사항) */
  userAvatar?: string;
  /** 커서 위치 (선택사항) */
  cursorPosition?: { x: number; y: number };
}

/**
 * 세션 정보 (통계용)
 */
export interface SessionInfo {
  /** 활성 상태 */
  isActive: boolean;
  /** 참가 시간 */
  joinedAt: Date;
  /** 마지막 활동 시간 */
  lastActivity: Date;
}

/**
 * 세션 통계
 */
export interface SessionStats {
  /** 전체 세션 수 */
  total: number;
  /** 활성 세션 수 */
  active: number;
  /** 비활성 세션 수 */
  inactive: number;
  /** 평균 세션 지속 시간 (분) */
  averageSessionDuration: number;
  /** 가장 오래된 활성 세션 참가 시간 (선택사항) */
  oldestActiveSession?: Date;
  /** 가장 최근 활성 세션 참가 시간 (선택사항) */
  newestActiveSession?: Date;
}
