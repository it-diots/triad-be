import { AuthProvider } from '../entities/user.entity';

/**
 * UserHandler 관련 타입 정의
 */

/**
 * 사용자 데이터 검증 입력
 */
export interface UserDataValidationInput {
  /** 이메일 */
  email: string;
  /** 사용자명 (선택사항) */
  username?: string;
  /** 비밀번호 (선택사항) */
  password?: string;
}

/**
 * 사용자 데이터 검증 결과
 */
export interface UserDataValidationResult {
  /** 유효성 여부 */
  isValid: boolean;
  /** 오류 목록 */
  errors: string[];
}

/**
 * OAuth 프로필 입력
 */
export interface OAuthProfileInput {
  /** 이메일 */
  email: string;
  /** 인증 제공자 */
  provider: AuthProvider;
  /** 제공자 사용자 ID */
  providerId: string;
  /** 사용자명 (선택사항) */
  username?: string;
  /** 이름 (선택사항) */
  firstName?: string;
  /** 성 (선택사항) */
  lastName?: string;
  /** 아바타 URL (선택사항) */
  avatar?: string;
  /** 제공자 데이터 (선택사항) */
  providerData?: Record<string, unknown>;
}

/**
 * OAuth 프로필 데이터 (준비 완료)
 */
export interface PreparedOAuthProfile {
  /** 이메일 */
  email: string;
  /** 인증 제공자 */
  provider: AuthProvider;
  /** 제공자 사용자 ID */
  providerId: string;
  /** 사용자명 */
  username: string;
  /** 이름 (선택사항) */
  firstName?: string;
  /** 성 (선택사항) */
  lastName?: string;
  /** 아바타 URL (선택사항) */
  avatar?: string;
  /** 제공자 데이터 */
  providerData: Record<string, unknown>;
  /** 이메일 검증 여부 */
  isEmailVerified: boolean;
}

/**
 * 사용자 충돌 검증 결과
 */
export interface UserConflictCheckResult {
  /** 충돌 여부 */
  hasConflict: boolean;
  /** 충돌 타입 (선택사항) */
  conflictType?: 'email' | 'username';
  /** 메시지 (선택사항) */
  message?: string;
}

/**
 * 사용자 엔티티 생성 입력 데이터
 */
export interface UserEntityInput {
  /** 이메일 */
  email: string;
  /** 사용자명 */
  username: string;
  /** 인증 제공자 (선택사항) */
  provider?: AuthProvider;
  /** 제공자 사용자 ID (선택사항) */
  providerId?: string;
  /** 이름 (선택사항) */
  firstName?: string;
  /** 성 (선택사항) */
  lastName?: string;
  /** 아바타 URL (선택사항) */
  avatar?: string;
  /** 비밀번호 (선택사항) */
  password?: string;
  /** 제공자 데이터 (선택사항) */
  providerData?: Record<string, unknown>;
  /** 이메일 검증 여부 (선택사항) */
  isEmailVerified?: boolean;
}
