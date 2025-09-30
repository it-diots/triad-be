/**
 * UrlHandler 관련 타입 정의
 */

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

/**
 * 단일 URL 변환 결과
 */
export interface UrlConversionResult {
  /** 원본 URL */
  url: string;
  /** 프로젝트 ID (선택사항) */
  projectId?: string;
  /** 성공 여부 */
  success: boolean;
  /** 에러 메시지 (선택사항) */
  error?: string;
}

/**
 * URL 목록 변환 결과
 */
export interface UrlBatchConversionResult {
  /** 프로젝트 ID 목록 */
  projectIds: string[];
  /** 개별 변환 결과 목록 */
  results: UrlConversionResult[];
}

/**
 * URL 패턴 분석 결과
 */
export interface UrlAnalysisResult {
  /** 로컬호스트 여부 */
  isLocalhost: boolean;
  /** 개발 환경 여부 */
  isDevelopment: boolean;
  /** 경로 존재 여부 */
  hasPath: boolean;
  /** 쿼리 파라미터 존재 여부 */
  hasQuery: boolean;
  /** 프래그먼트 존재 여부 */
  hasFragment: boolean;
  /** 프로토콜 */
  protocol: string;
  /** 호스트명 */
  hostname: string;
  /** 경로 세그먼트 목록 */
  pathSegments: string[];
  /** 추정 프로젝트 타입 */
  estimatedProjectType: 'development' | 'staging' | 'production';
}

/**
 * URL 시큐리티 검증 결과
 */
export interface UrlSecurityValidationResult {
  /** 안전 여부 */
  isSafe: boolean;
  /** 경고 목록 */
  warnings: string[];
  /** 권장사항 목록 */
  recommendations: string[];
}
