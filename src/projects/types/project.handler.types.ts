/**
 * ProjectHandler 관련 타입 정의
 */

/**
 * 프로젝트 데이터 검증 입력
 */
export interface ProjectDataValidationInput {
  /** 프로젝트명 */
  name: string;
  /** URL (선택사항) */
  url?: string;
  /** 설명 (선택사항) */
  description?: string;
}

/**
 * 프로젝트 데이터 검증 결과
 */
export interface ProjectDataValidationResult {
  /** 유효성 여부 */
  isValid: boolean;
  /** 오류 목록 */
  errors: string[];
}

/**
 * 프로젝트 정보 (접근 권한 확인용)
 */
export interface ProjectAccessInfo {
  /** 소유자 ID */
  ownerId: string;
  /** 설정 (선택사항) */
  settings?: Record<string, unknown>;
}

/**
 * 프로젝트 접근 권한 확인 결과
 */
export interface ProjectAccessCheckResult {
  /** 접근 권한 여부 */
  hasAccess: boolean;
  /** 접근 가능/불가능 사유 */
  reason: string;
}

/**
 * URL 검증 결과
 */
export interface UrlValidationResult {
  /** 유효성 여부 */
  isValid: boolean;
  /** 에러 메시지 (선택사항) */
  error?: string;
  /** 정규화된 URL (선택사항) */
  normalizedUrl?: string;
}
