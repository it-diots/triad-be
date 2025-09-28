import { ApiProperty } from '@nestjs/swagger';

import { apiPropertyPresets } from '../decorators/api-property.decorator';
import {
  AuthProvider,
  CommentBase,
  CommentPosition,
  CommentThreadBase,
  CursorPosition,
  ProjectBase,
  ProjectSessionBase,
  ProjectSettings,
  UserBase,
  UserRole,
  UserStatus,
} from '../types/base.types';

/**
 * 기본 응답 DTO
 * 모든 응답 DTO의 베이스 클래스로 공통 필드들을 포함
 */
export abstract class BaseResponseDto {
  /**
   * 고유 식별자
   */
  @ApiProperty(apiPropertyPresets.id())
  id: string;

  /**
   * 생성 시간
   */
  @ApiProperty(apiPropertyPresets.dateTime('생성 시간'))
  createdAt: Date;

  /**
   * 수정 시간
   */
  @ApiProperty(apiPropertyPresets.dateTime('수정 시간'))
  updatedAt: Date;

  /**
   * 삭제 시간 (선택사항)
   */
  @ApiProperty(apiPropertyPresets.dateTime('삭제 시간', false))
  deletedAt?: Date;
}

/**
 * 사용자 응답 DTO
 * 사용자의 전체 정보를 포함하는 응답 데이터
 */
export class UserResponseDto
  extends BaseResponseDto
  implements
    Pick<
      UserBase,
      | 'id'
      | 'email'
      | 'username'
      | 'firstName'
      | 'lastName'
      | 'avatar'
      | 'role'
      | 'status'
      | 'provider'
      | 'emailVerifiedAt'
      | 'lastLoginAt'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
    >
{
  @ApiProperty(apiPropertyPresets.email())
  email: string;

  @ApiProperty(apiPropertyPresets.username())
  username: string;

  @ApiProperty(apiPropertyPresets.firstName())
  firstName?: string;

  @ApiProperty(apiPropertyPresets.lastName())
  lastName?: string;

  @ApiProperty(apiPropertyPresets.avatar())
  avatar?: string;

  @ApiProperty(apiPropertyPresets.enum('사용자 역할', UserRole, UserRole.USER))
  role: UserRole;

  @ApiProperty(apiPropertyPresets.enum('계정 상태', UserStatus, UserStatus.ACTIVE))
  status: UserStatus;

  @ApiProperty(apiPropertyPresets.enum('인증 제공자', AuthProvider, AuthProvider.LOCAL))
  provider: AuthProvider;

  @ApiProperty(apiPropertyPresets.dateTime('이메일 인증 시간', false))
  emailVerifiedAt?: Date;

  @ApiProperty(apiPropertyPresets.dateTime('마지막 로그인 시간', false))
  lastLoginAt?: Date;
}

/**
 * 사용자 프로필 응답 DTO
 * 사용자의 프로필 정보만 포함하는 응답 데이터
 */
export class UserProfileResponseDto
  extends BaseResponseDto
  implements
    Pick<
      UserBase,
      'id' | 'username' | 'firstName' | 'lastName' | 'avatar' | 'role' | 'createdAt' | 'updatedAt'
    >
{
  @ApiProperty(apiPropertyPresets.username())
  username: string;

  @ApiProperty(apiPropertyPresets.firstName())
  firstName?: string;

  @ApiProperty(apiPropertyPresets.lastName())
  lastName?: string;

  @ApiProperty(apiPropertyPresets.avatar())
  avatar?: string;

  @ApiProperty(apiPropertyPresets.enum('사용자 역할', UserRole, UserRole.USER))
  role: UserRole;
}

/**
 * 사용자 요약 응답 DTO
 * 사용자의 기본 정보만 포함하는 간략한 응답 데이터
 */
export class UserSummaryResponseDto implements Pick<UserBase, 'id' | 'username' | 'avatar'> {
  @ApiProperty(apiPropertyPresets.id())
  id: string;

  @ApiProperty(apiPropertyPresets.username())
  username: string;

  @ApiProperty(apiPropertyPresets.avatar())
  avatar?: string;
}

/**
 * 프로젝트 응답 DTO
 * 프로젝트의 전체 정보를 포함하는 응답 데이터
 */
export class ProjectResponseDto
  extends BaseResponseDto
  implements
    Pick<
      ProjectBase,
      | 'id'
      | 'name'
      | 'description'
      | 'url'
      | 'domain'
      | 'isPublic'
      | 'ownerId'
      | 'settings'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
    >
{
  @ApiProperty(apiPropertyPresets.string('프로젝트 이름', 'My Project'))
  name: string;

  @ApiProperty(
    apiPropertyPresets.string('프로젝트 설명', 'Project description', { required: false }),
  )
  description?: string;

  @ApiProperty(apiPropertyPresets.url('프로젝트 URL', false))
  url?: string;

  @ApiProperty(apiPropertyPresets.string('프로젝트 도메인', 'example.com', { required: false }))
  domain?: string;

  @ApiProperty(apiPropertyPresets.boolean('공개 여부', false))
  isPublic: boolean;

  @ApiProperty(apiPropertyPresets.id())
  ownerId: string;

  @ApiProperty({
    description: '프로젝트 설정',
    type: Object,
    required: false,
    example: {
      allowComments: true,
      allowGuests: false,
      maxParticipants: 10,
      isPublic: false,
    },
  })
  settings?: ProjectSettings;

  @ApiProperty({ type: UserSummaryResponseDto, description: '프로젝트 소유자 정보' })
  owner?: UserSummaryResponseDto;
}

/**
 * 프로젝트 요약 응답 DTO
 * 프로젝트의 기본 정보만 포함하는 간략한 응답 데이터
 */
export class ProjectSummaryResponseDto
  implements Pick<ProjectBase, 'id' | 'name' | 'url' | 'isPublic'>
{
  @ApiProperty(apiPropertyPresets.id())
  id: string;

  @ApiProperty(apiPropertyPresets.string('프로젝트 이름', 'My Project'))
  name: string;

  @ApiProperty(apiPropertyPresets.url('프로젝트 URL', false))
  url?: string;

  @ApiProperty(apiPropertyPresets.boolean('공개 여부', false))
  isPublic: boolean;
}

/**
 * 코멘트 응답 DTO
 * 코멘트의 전체 정보를 포함하는 응답 데이터
 */
export class CommentResponseDto
  extends BaseResponseDto
  implements
    Pick<
      CommentBase,
      | 'id'
      | 'projectId'
      | 'userId'
      | 'threadId'
      | 'content'
      | 'images'
      | 'position'
      | 'parentId'
      | 'isResolved'
      | 'resolvedAt'
      | 'resolvedBy'
      | 'url'
      | 'xpath'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
    >
{
  @ApiProperty(apiPropertyPresets.id())
  projectId: string;

  @ApiProperty(apiPropertyPresets.id())
  userId: string;

  @ApiProperty(apiPropertyPresets.id())
  threadId: string;

  @ApiProperty(apiPropertyPresets.string('코멘트 내용', 'This is a comment'))
  content: string;

  @ApiProperty(apiPropertyPresets.array('첨부 이미지 URL 목록', String, []))
  images: string[];

  @ApiProperty({
    description: '코멘트 위치 좌표',
    type: Object,
    example: { x: 100, y: 200 },
  })
  position: CommentPosition;

  @ApiProperty(apiPropertyPresets.id())
  parentId?: string;

  @ApiProperty(apiPropertyPresets.boolean('해결 상태', false))
  isResolved: boolean;

  @ApiProperty(apiPropertyPresets.dateTime('해결 시간', false))
  resolvedAt?: Date;

  @ApiProperty(apiPropertyPresets.id())
  resolvedBy?: string;

  @ApiProperty(apiPropertyPresets.url('페이지 URL', false))
  url?: string;

  @ApiProperty(apiPropertyPresets.string('DOM 경로', '/html/body/div[1]', { required: false }))
  xpath?: string;

  @ApiProperty({ type: UserSummaryResponseDto, description: '작성자 정보' })
  user?: UserSummaryResponseDto;

  @ApiProperty({ type: UserSummaryResponseDto, description: '해결자 정보', required: false })
  resolver?: UserSummaryResponseDto;

  @ApiProperty({ type: () => [CommentResponseDto], description: '답글 목록', required: false })
  replies?: CommentResponseDto[];
}

/**
 * 코멘트 스레드 응답 DTO
 * 코멘트 스레드의 전체 정보를 포함하는 응답 데이터
 */
export class CommentThreadResponseDto
  extends BaseResponseDto
  implements
    Pick<
      CommentThreadBase,
      | 'id'
      | 'projectId'
      | 'url'
      | 'pageTitle'
      | 'isResolved'
      | 'resolvedAt'
      | 'resolvedBy'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
    >
{
  @ApiProperty(apiPropertyPresets.id())
  projectId: string;

  @ApiProperty(apiPropertyPresets.url('스레드 URL', false))
  url?: string;

  @ApiProperty(apiPropertyPresets.string('페이지 제목', 'Page Title', { required: false }))
  pageTitle?: string;

  @ApiProperty(apiPropertyPresets.boolean('해결 상태', false))
  isResolved: boolean;

  @ApiProperty(apiPropertyPresets.dateTime('해결 시간', false))
  resolvedAt?: Date;

  @ApiProperty(apiPropertyPresets.id())
  resolvedBy?: string;

  @ApiProperty({ type: UserSummaryResponseDto, description: '해결자 정보', required: false })
  resolver?: UserSummaryResponseDto;

  @ApiProperty({ type: () => [CommentResponseDto], description: '코멘트 목록' })
  comments: CommentResponseDto[];
}

/**
 * 프로젝트 세션 응답 DTO
 * 프로젝트 협업 세션의 전체 정보를 포함하는 응답 데이터
 */
export class ProjectSessionResponseDto
  extends BaseResponseDto
  implements
    Pick<
      ProjectSessionBase,
      | 'id'
      | 'projectId'
      | 'userId'
      | 'username'
      | 'userEmail'
      | 'userAvatar'
      | 'isActive'
      | 'cursorPosition'
      | 'lastActivity'
      | 'joinedAt'
      | 'createdAt'
      | 'updatedAt'
    >
{
  @ApiProperty(apiPropertyPresets.id())
  projectId: string;

  @ApiProperty(apiPropertyPresets.id())
  userId: string;

  @ApiProperty(apiPropertyPresets.username())
  username: string;

  @ApiProperty(apiPropertyPresets.email(false))
  userEmail?: string;

  @ApiProperty(apiPropertyPresets.avatar())
  userAvatar?: string;

  @ApiProperty(apiPropertyPresets.boolean('활성 상태', true))
  isActive: boolean;

  @ApiProperty({
    description: '커서 위치',
    type: Object,
    required: false,
    example: { x: 100, y: 200 },
  })
  cursorPosition?: CursorPosition;

  @ApiProperty(apiPropertyPresets.dateTime('마지막 활동 시간'))
  lastActivity: Date;

  @ApiProperty(apiPropertyPresets.dateTime('참가 시간'))
  joinedAt: Date;

  @ApiProperty({ type: UserSummaryResponseDto, description: '사용자 정보' })
  user?: UserSummaryResponseDto;
}

/**
 * 사용자 목록 응답 DTO
 * 사용자 목록과 페이지네이션 정보를 포함하는 응답 데이터
 */
export class UserListResponseDto {
  @ApiProperty({ type: [UserResponseDto], description: '사용자 목록' })
  users: UserResponseDto[];

  @ApiProperty(apiPropertyPresets.number('전체 사용자 수', 100))
  total: number;

  @ApiProperty(apiPropertyPresets.number('현재 페이지', 1))
  page: number;

  @ApiProperty(apiPropertyPresets.number('페이지당 항목 수', 20))
  limit: number;
}

/**
 * 프로젝트 목록 응답 DTO
 * 프로젝트 목록과 페이지네이션 정보를 포함하는 응답 데이터
 */
export class ProjectListResponseDto {
  @ApiProperty({ type: [ProjectResponseDto], description: '프로젝트 목록' })
  projects: ProjectResponseDto[];

  @ApiProperty(apiPropertyPresets.number('전체 프로젝트 수', 50))
  total: number;

  @ApiProperty(apiPropertyPresets.number('현재 페이지', 1))
  page: number;

  @ApiProperty(apiPropertyPresets.number('페이지당 항목 수', 20))
  limit: number;
}

/**
 * 코멘트 목록 응답 DTO
 * 코멘트 목록과 페이지네이션 정보를 포함하는 응답 데이터
 */
export class CommentListResponseDto {
  @ApiProperty({ type: [CommentResponseDto], description: '코멘트 목록' })
  comments: CommentResponseDto[];

  @ApiProperty(apiPropertyPresets.number('전체 코멘트 수', 25))
  total: number;

  @ApiProperty(apiPropertyPresets.number('현재 페이지', 1))
  page: number;

  @ApiProperty(apiPropertyPresets.number('페이지당 항목 수', 20))
  limit: number;
}
