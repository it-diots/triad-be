// Base Types for Entities
// 엔티티의 공통 필드들을 타입으로 정의

/**
 * 모든 엔티티의 기본 인터페이스
 * 공통 필드들을 포함하는 기본 타입
 */
export interface BaseEntity {
  /** 엔티티의 고유 식별자 (UUID) */
  id: string;
  /** 엔티티 생성 시간 */
  createdAt: Date;
  /** 엔티티 수정 시간 */
  updatedAt: Date;
  /** 엔티티 삭제 시간 (소프트 삭제) */
  deletedAt?: Date;
}

/**
 * 타임스탬프 필드 인터페이스
 * 생성, 수정, 삭제 시간을 관리하는 필드들
 */
export interface TimestampFields {
  /** 생성 시간 */
  createdAt: Date;
  /** 수정 시간 */
  updatedAt: Date;
  /** 삭제 시간 (소프트 삭제) */
  deletedAt?: Date;
}

// User Entity Base Types

/**
 * 사용자 역할 열거형
 * 시스템 내에서 사용자의 권한 수준을 정의
 */
export enum UserRole {
  /** 일반 사용자 */
  USER = 'USER',
  /** 관리자 */
  ADMIN = 'ADMIN',
  /** 중재자 */
  MODERATOR = 'MODERATOR',
}

/**
 * 사용자 계정 상태 열거형
 * 사용자 계정의 현재 상태를 나타냄
 */
export enum UserStatus {
  /** 활성 상태 */
  ACTIVE = 'ACTIVE',
  /** 비활성 상태 */
  INACTIVE = 'INACTIVE',
  /** 정지된 상태 */
  SUSPENDED = 'SUSPENDED',
  /** 삭제된 상태 */
  DELETED = 'DELETED',
}

/**
 * 인증 제공자 열거형
 * 사용자가 인증에 사용한 서비스를 나타냄
 */
export enum AuthProvider {
  /** 로컬 인증 (이메일/비밀번호) */
  LOCAL = 'LOCAL',
  /** Google OAuth */
  GOOGLE = 'GOOGLE',
  /** GitHub OAuth */
  GITHUB = 'GITHUB',
}

/**
 * 사용자 기본 정보 인터페이스
 * 사용자 엔티티의 기본 필드들을 정의
 */
export interface UserBase extends BaseEntity {
  /** 사용자 이메일 주소 */
  email: string;
  /** 사용자명 */
  username: string;
  /** 사용자 이름 */
  firstName?: string;
  /** 사용자 성 */
  lastName?: string;
  /** 프로필 이미지 URL */
  avatar?: string;
  /** 사용자 역할 */
  role: UserRole;
  /** 계정 상태 */
  status: UserStatus;
  /** 인증 제공자 */
  provider: AuthProvider;
  /** 외부 인증 제공자 ID */
  providerId?: string;
  /** 인증 제공자 추가 데이터 */
  providerData?: Record<string, unknown>;
  /** 이메일 인증 완료 시간 */
  emailVerifiedAt?: Date;
  /** 마지막 로그인 시간 */
  lastLoginAt?: Date;
}

// Project Entity Base Types

/**
 * 프로젝트 설정 인터페이스
 * 프로젝트의 다양한 설정 옵션들을 정의
 */
export interface ProjectSettings {
  /** 코멘트 허용 여부 */
  allowComments: boolean;
  /** 게스트 사용자 허용 여부 */
  allowGuests: boolean;
  /** 최대 참여자 수 제한 */
  maxParticipants?: number;
  /** 프로젝트 공개 여부 */
  isPublic: boolean;
}

/**
 * 프로젝트 기본 정보 인터페이스
 * 프로젝트 엔티티의 기본 필드들을 정의
 */
export interface ProjectBase extends BaseEntity {
  /** 프로젝트 이름 */
  name: string;
  /** 프로젝트 설명 */
  description?: string;
  /** 프로젝트 URL */
  url?: string;
  /** 프로젝트 도메인 */
  domain?: string;
  /** 프로젝트 공개 여부 */
  isPublic: boolean;
  /** 프로젝트 소유자 ID */
  ownerId: string;
  /** 프로젝트 설정 */
  settings?: ProjectSettings;
}

// Comment Entity Base Types

/**
 * 코멘트 위치 인터페이스
 * 화면 상에서 코멘트가 표시될 좌표를 정의
 */
export interface CommentPosition {
  /** X 좌표 */
  x: number;
  /** Y 좌표 */
  y: number;
}

/**
 * 코멘트 기본 정보 인터페이스
 * 코멘트 엔티티의 기본 필드들을 정의
 */
export interface CommentBase extends BaseEntity {
  /** 프로젝트 ID */
  projectId: string;
  /** 작성자 ID */
  userId: string;
  /** 코멘트 스레드 ID */
  threadId: string;
  /** 코멘트 본문 (리치 텍스트) */
  body: Record<string, unknown>[];
  /** 코멘트 내용 (일반 텍스트) */
  content: string;
  /** 첨부 이미지 URL 목록 */
  images: string[];
  /** 관련 커밋 SHA */
  commitSha: string;
  /** 페이지 URL */
  href: string;
  /** 로컬호스트에서 작성 여부 */
  leftOnLocalhost: boolean;
  /** 배포 ID */
  deploymentId: string;
  /** 코멘트 위치 */
  position: CommentPosition;
  /** 부모 코멘트 ID (답글인 경우) */
  parentId?: string;
  /** 해결 상태 */
  isResolved: boolean;
  /** 해결된 시간 */
  resolvedAt?: Date;
  /** 해결한 사용자 ID */
  resolvedBy?: string;
  /** 코멘트가 작성된 페이지 URL */
  url?: string;
  /** DOM 경로 (XPath) */
  xpath?: string;
}

// CommentThread Entity Base Types

/**
 * 코멘트 스레드 기본 정보 인터페이스
 * 코멘트들을 그룹화하는 스레드의 기본 필드들을 정의
 */
export interface CommentThreadBase extends BaseEntity {
  /** 프로젝트 ID */
  projectId: string;
  /** 스레드가 생성된 페이지 URL */
  url?: string;
  /** 페이지 제목 */
  pageTitle?: string;
  /** 스레드 해결 상태 */
  isResolved: boolean;
  /** 해결된 시간 */
  resolvedAt?: Date;
  /** 해결한 사용자 ID */
  resolvedBy?: string;
}

// ProjectSession Entity Base Types

/**
 * 커서 위치 인터페이스
 * 실시간 협업 시 사용자 커서의 위치를 정의
 */
export interface CursorPosition {
  /** X 좌표 */
  x: number;
  /** Y 좌표 */
  y: number;
}

/**
 * 프로젝트 세션 기본 정보 인터페이스
 * 프로젝트 협업 세션의 기본 필드들을 정의
 */
export interface ProjectSessionBase extends BaseEntity {
  /** 프로젝트 ID */
  projectId: string;
  /** 사용자 ID */
  userId: string;
  /** 사용자명 */
  username: string;
  /** 사용자 이메일 */
  userEmail?: string;
  /** 사용자 프로필 이미지 URL */
  userAvatar?: string;
  /** 세션 활성 상태 */
  isActive: boolean;
  /** 커서 위치 */
  cursorPosition?: CursorPosition;
  /** 마지막 활동 시간 */
  lastActivity: Date;
  /** 세션 참가 시간 */
  joinedAt: Date;
}
