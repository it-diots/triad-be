/**
 * 프로젝트 관련 타입 정의
 * 프로젝트 도메인에서 사용되는 타입들
 */

/**
 * 프로젝트 생성 옵션 인터페이스
 * 프로젝트 생성 시 추가 옵션
 */
export interface ProjectCreationOptions {
  /** 기본 설정 사용 여부 */
  useDefaultSettings?: boolean;
  /** 즉시 활성화 여부 */
  activateImmediately?: boolean;
  /** 초기 멤버 ID 목록 */
  initialMembers?: string[];
}

/**
 * 프로젝트 소유권 검증 결과 인터페이스
 */
export interface OwnershipValidationResult {
  /** 소유권 여부 */
  isOwner: boolean;
  /** 실제 소유자 ID */
  actualOwnerId: string;
  /** 권한 수준 */
  permissionLevel: 'owner' | 'member' | 'viewer' | 'none';
}

/**
 * 프로젝트 통계 인터페이스
 * 프로젝트 관련 통계 정보
 */
export interface ProjectStatistics {
  /** 전체 프로젝트 수 */
  totalProjects: number;
  /** 공개 프로젝트 수 */
  publicProjects: number;
  /** 활성 프로젝트 수 */
  activeProjects: number;
  /** 참여자 수 */
  totalParticipants: number;
  /** 코멘트 수 */
  totalComments: number;
}

/**
 * URL 프로젝트 매핑 인터페이스
 * URL과 프로젝트 ID 간의 매핑 정보
 */
export interface UrlProjectMapping {
  /** 원본 URL */
  url: string;
  /** 프로젝트 ID */
  projectId: string;
  /** 도메인 */
  domain: string;
  /** 경로 */
  path: string;
  /** 생성 시간 */
  createdAt: Date;
}

/**
 * 프로젝트 멤버 권한 인터페이스
 */
export interface ProjectMemberPermission {
  /** 사용자 ID */
  userId: string;
  /** 프로젝트 ID */
  projectId: string;
  /** 권한 수준 */
  permission: 'owner' | 'admin' | 'member' | 'viewer';
  /** 권한 부여 시간 */
  grantedAt: Date;
  /** 권한 부여자 ID */
  grantedBy: string;
}

/**
 * 프로젝트 필터 옵션 인터페이스
 */
export interface ProjectFilterOptions {
  /** 검색어 */
  search?: string;
  /** 소유자 ID */
  ownerId?: string;
  /** 공개 여부 */
  isPublic?: boolean;
  /** 도메인 */
  domain?: string;
  /** 생성일 시작 */
  createdAfter?: Date;
  /** 생성일 끝 */
  createdBefore?: Date;
}
