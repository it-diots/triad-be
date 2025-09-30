/**
 * MutationHandler 관련 타입 정의
 */

/**
 * 뮤테이션 데이터 준비 결과
 */
export interface MutationEntityData {
  /** 프로젝트 ID */
  projectId: string;
  /** 사용자 ID */
  userId: string;
  /** 뮤테이션 타입 */
  type: string;
  /** 메타데이터 */
  metadata: Record<string, unknown>;
  /** 타임스탬프 */
  timestamp: Date;
}

/**
 * 뮤테이션 검증 결과
 */
export interface MutationValidationResult {
  /** 유효성 여부 */
  isValid: boolean;
  /** 오류 목록 */
  errors: string[];
  /** 경고 목록 */
  warnings: string[];
}

/**
 * 개별 뮤테이션 데이터 구조
 */
export interface SingleMutationData {
  /** 뮤테이션 ID */
  id: number;
  /** 뮤테이션 이름 */
  name: string;
  /** 뮤테이션 인자 */
  args: Record<string, unknown>;
  /** 타임스탬프 */
  timestamp: number;
}

/**
 * 코멘트 스레드 검증 결과
 */
export interface CommentThreadValidationResult {
  /** 유효성 여부 */
  isValid: boolean;
  /** 오류 목록 */
  errors: string[];
}

/**
 * 개별 뮤테이션 처리 결과
 */
export interface MutationProcessResult {
  /** 뮤테이션 ID */
  mutationId: number;
  /** 처리 상태 */
  status: 'success' | 'failed';
  /** 에러 메시지 (실패 시) */
  error?: string;
}

/**
 * 배치 처리 결과
 */
export interface BatchProcessResult {
  /** 성공 여부 */
  success: boolean;
  /** 처리된 뮤테이션 수 */
  processedMutations: number;
  /** 실패한 뮤테이션 수 */
  failedMutations: number;
  /** 개별 처리 결과 목록 */
  results: MutationProcessResult[];
  /** 처리 요약 */
  summary: {
    /** 성공률 (%) */
    successRate: number;
    /** 전체 뮤테이션 수 */
    totalMutations: number;
    /** 공통 에러 목록 */
    commonErrors: string[];
  };
}
