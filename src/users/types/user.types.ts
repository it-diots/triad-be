/**
 * 사용자 관련 타입 정의
 * 사용자 도메인에서 사용되는 타입들
 */

/**
 * 사용자 검증 결과 인터페이스
 * 사용자 중복 검증 결과를 나타냄
 */
export interface UserValidationResult {
  /** 유효성 여부 */
  isValid: boolean;
  /** 에러 메시지 (유효하지 않은 경우) */
  errorMessage?: string;
  /** 충돌 필드 (이메일/사용자명) */
  conflictField?: 'email' | 'username';
}

/**
 * 사용자명 생성 옵션 인터페이스
 * 유니크한 사용자명 생성 시 사용되는 옵션
 */
export interface UsernameGenerationOptions {
  /** 기본 사용자명 */
  baseUsername: string;
  /** 최대 시도 횟수 */
  maxAttempts?: number;
  /** 구분자 */
  separator?: string;
}

/**
 * 사용자 필터 옵션 인터페이스
 * 사용자 목록 조회 시 필터링 옵션
 */
export interface UserFilterOptions {
  /** 검색어 */
  search?: string;
  /** 사용자 역할 */
  role?: 'USER' | 'ADMIN' | 'MODERATOR';
  /** 계정 상태 */
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
  /** 인증 제공자 */
  provider?: 'LOCAL' | 'GOOGLE' | 'GITHUB';
  /** 이메일 인증 여부 */
  emailVerified?: boolean;
}

/**
 * 사용자 통계 인터페이스
 * 사용자 관련 통계 정보
 */
export interface UserStatistics {
  /** 전체 사용자 수 */
  totalUsers: number;
  /** 활성 사용자 수 */
  activeUsers: number;
  /** 오늘 가입한 사용자 수 */
  newUsersToday: number;
  /** 제공자별 사용자 수 */
  usersByProvider: {
    LOCAL: number;
    GOOGLE: number;
    GITHUB: number;
  };
}

/**
 * 비밀번호 변경 결과 인터페이스
 */
export interface PasswordChangeResult {
  /** 성공 여부 */
  success: boolean;
  /** 메시지 */
  message: string;
  /** 비밀번호 변경 시간 */
  changedAt?: Date;
}
