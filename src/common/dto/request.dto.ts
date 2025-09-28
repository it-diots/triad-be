import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { apiPropertyPresets } from '../decorators/api-property.decorator';
import {
  AuthProvider,
  CommentPosition,
  CursorPosition,
  ProjectSettings,
  UserRole,
  UserStatus,
} from '../types/base.types';

/**
 * 페이지네이션 기본 요청 DTO
 * 모든 페이지네이션을 사용하는 요청 DTO의 베이스 클래스
 */
export abstract class PaginationRequestDto {
  /**
   * 페이지 번호 (1부터 시작)
   */
  @ApiPropertyOptional(apiPropertyPresets.number('페이지 번호 (1부터 시작)', 1, { minimum: 1 }))
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  /**
   * 페이지당 항목 수 (최대 100개)
   */
  @ApiPropertyOptional(
    apiPropertyPresets.number('페이지당 항목 수', 20, { minimum: 1, maximum: 100 }),
  )
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}

/**
 * 사용자 생성 요청 DTO
 * 새로운 사용자 계정을 생성할 때 사용되는 요청 데이터
 */
export class CreateUserRequestDto {
  /**
   * 사용자 이메일 주소
   */
  @ApiProperty(apiPropertyPresets.email())
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * 사용자 비밀번호 (8-50자)
   */
  @ApiProperty(apiPropertyPresets.password())
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;

  /**
   * 사용자명 (3-20자)
   */
  @ApiProperty(apiPropertyPresets.username())
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @IsNotEmpty()
  username: string;

  /**
   * 이름 (선택사항)
   */
  @ApiPropertyOptional(apiPropertyPresets.firstName())
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  /**
   * 성 (선택사항)
   */
  @ApiPropertyOptional(apiPropertyPresets.lastName())
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  /**
   * 프로필 이미지 URL (선택사항)
   */
  @ApiPropertyOptional(apiPropertyPresets.avatar())
  @IsOptional()
  @IsUrl()
  avatar?: string;
}

/**
 * 사용자 정보 수정 요청 DTO
 * 기존 사용자 정보를 업데이트할 때 사용되는 요청 데이터
 */
export class UpdateUserRequestDto {
  /**
   * 사용자명 (3-20자, 선택사항)
   */
  @ApiPropertyOptional(apiPropertyPresets.username())
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username?: string;

  /**
   * 이름 (선택사항)
   */
  @ApiPropertyOptional(apiPropertyPresets.firstName())
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  /**
   * 성 (선택사항)
   */
  @ApiPropertyOptional(apiPropertyPresets.lastName())
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  /**
   * 프로필 이미지 URL (선택사항)
   */
  @ApiPropertyOptional(apiPropertyPresets.avatar())
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiPropertyOptional(apiPropertyPresets.enum('사용자 역할', UserRole, UserRole.USER))
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional(apiPropertyPresets.enum('계정 상태', UserStatus, UserStatus.ACTIVE))
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

/**
 * 비밀번호 변경 요청 DTO
 * 사용자의 비밀번호를 변경할 때 사용되는 요청 데이터
 */
export class ChangePasswordRequestDto {
  @ApiProperty(apiPropertyPresets.string('현재 비밀번호', 'currentPassword123!'))
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty(apiPropertyPresets.password())
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  newPassword: string;
}

/**
 * 사용자 검색 요청 DTO
 * 사용자 목록을 검색할 때 사용되는 요청 데이터
 */
export class UserSearchRequestDto extends PaginationRequestDto {
  @ApiPropertyOptional(apiPropertyPresets.string('검색어', 'john', { required: false }))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional(apiPropertyPresets.enum('사용자 역할', UserRole, UserRole.USER))
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional(apiPropertyPresets.enum('계정 상태', UserStatus, UserStatus.ACTIVE))
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional(apiPropertyPresets.enum('인증 제공자', AuthProvider, AuthProvider.LOCAL))
  @IsOptional()
  @IsEnum(AuthProvider)
  provider?: AuthProvider;
}

// Project Request DTOs
/**
 * 프로젝트 설정 요청 DTO
 * 프로젝트의 설정 정보를 정의하는 데이터
 */
export class ProjectSettingsRequestDto implements ProjectSettings {
  @ApiProperty(apiPropertyPresets.boolean('코멘트 허용 여부', true))
  @IsBoolean()
  allowComments: boolean;

  @ApiProperty(apiPropertyPresets.boolean('게스트 허용 여부', false))
  @IsBoolean()
  allowGuests: boolean;

  @ApiPropertyOptional(
    apiPropertyPresets.number('최대 참여자 수', 10, { minimum: 1, maximum: 100 }),
  )
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxParticipants?: number;

  @ApiProperty(apiPropertyPresets.boolean('공개 여부', false))
  @IsBoolean()
  isPublic: boolean;
}

/**
 * 프로젝트 생성 요청 DTO
 * 새로운 프로젝트를 생성할 때 사용되는 요청 데이터
 */
export class CreateProjectRequestDto {
  @ApiProperty(apiPropertyPresets.string('프로젝트 이름', 'My Awesome Project'))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional(
    apiPropertyPresets.string('프로젝트 설명', 'This is my project description', {
      required: false,
    }),
  )
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional(apiPropertyPresets.url('프로젝트 URL', false))
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  url?: string;

  @ApiPropertyOptional(
    apiPropertyPresets.string('프로젝트 도메인', 'example.com', { required: false }),
  )
  @IsOptional()
  @IsString()
  @MaxLength(255)
  domain?: string;

  @ApiProperty(apiPropertyPresets.boolean('공개 여부', false))
  @IsBoolean()
  isPublic: boolean;

  @ApiPropertyOptional({ type: ProjectSettingsRequestDto, description: '프로젝트 설정' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ProjectSettingsRequestDto)
  settings?: ProjectSettingsRequestDto;
}

/**
 * 프로젝트 수정 요청 DTO
 * 기존 프로젝트 정보를 업데이트할 때 사용되는 요청 데이터
 */
export class UpdateProjectRequestDto {
  @ApiPropertyOptional(apiPropertyPresets.string('프로젝트 이름', 'Updated Project Name'))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional(
    apiPropertyPresets.string('프로젝트 설명', 'Updated description', { required: false }),
  )
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional(apiPropertyPresets.url('프로젝트 URL', false))
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  url?: string;

  @ApiPropertyOptional(
    apiPropertyPresets.string('프로젝트 도메인', 'newdomain.com', { required: false }),
  )
  @IsOptional()
  @IsString()
  @MaxLength(255)
  domain?: string;

  @ApiPropertyOptional(apiPropertyPresets.boolean('공개 여부', true))
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ type: ProjectSettingsRequestDto, description: '프로젝트 설정' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ProjectSettingsRequestDto)
  settings?: ProjectSettingsRequestDto;
}

/**
 * 프로젝트 검색 요청 DTO
 * 프로젝트 목록을 검색할 때 사용되는 요청 데이터
 */
export class ProjectSearchRequestDto extends PaginationRequestDto {
  @ApiPropertyOptional(apiPropertyPresets.string('검색어', 'my project', { required: false }))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional(apiPropertyPresets.id())
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional(apiPropertyPresets.boolean('공개 프로젝트만', true))
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPublic?: boolean;

  @ApiPropertyOptional(apiPropertyPresets.string('도메인', 'example.com', { required: false }))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  domain?: string;
}

// Comment Request DTOs
/**
 * 코멘트 위치 요청 DTO
 * 코멘트의 화면 상 위치 좌표를 나타내는 데이터
 */
export class CommentPositionRequestDto implements CommentPosition {
  @ApiProperty(apiPropertyPresets.number('X 좌표', 100, { minimum: 0 }))
  @IsNumber()
  @Min(0)
  x: number;

  @ApiProperty(apiPropertyPresets.number('Y 좌표', 200, { minimum: 0 }))
  @IsNumber()
  @Min(0)
  y: number;
}

/**
 * 코멘트 생성 요청 DTO
 * 새로운 코멘트를 생성할 때 사용되는 요청 데이터
 */
export class CreateCommentRequestDto {
  @ApiProperty(apiPropertyPresets.id())
  @IsUUID()
  @IsNotEmpty()
  threadId: string;

  @ApiProperty(apiPropertyPresets.string('코멘트 내용', 'This is my comment'))
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional(apiPropertyPresets.array('첨부 이미지 URL 목록', String, []))
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @ApiProperty({ type: CommentPositionRequestDto, description: '코멘트 위치 좌표' })
  @IsObject()
  @ValidateNested()
  @Type(() => CommentPositionRequestDto)
  position: CommentPositionRequestDto;

  @ApiPropertyOptional(apiPropertyPresets.id())
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional(apiPropertyPresets.url('페이지 URL', false))
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  url?: string;

  @ApiPropertyOptional(
    apiPropertyPresets.string('DOM 경로', '/html/body/div[1]', { required: false }),
  )
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  xpath?: string;
}

/**
 * 코멘트 수정 요청 DTO
 * 기존 코멘트를 수정할 때 사용되는 요청 데이터
 */
export class UpdateCommentRequestDto {
  @ApiPropertyOptional(apiPropertyPresets.string('코멘트 내용', 'Updated comment'))
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional(apiPropertyPresets.array('첨부 이미지 URL 목록', String, []))
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @ApiPropertyOptional({ type: CommentPositionRequestDto, description: '코멘트 위치 좌표' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CommentPositionRequestDto)
  position?: CommentPositionRequestDto;

  @ApiPropertyOptional(apiPropertyPresets.boolean('해결 상태', false))
  @IsOptional()
  @IsBoolean()
  isResolved?: boolean;
}

// CommentThread Request DTOs
/**
 * 코멘트 스레드 생성 요청 DTO
 * 새로운 코멘트 스레드를 생성할 때 사용되는 요청 데이터
 */
export class CreateCommentThreadRequestDto {
  @ApiPropertyOptional(apiPropertyPresets.url('스레드 URL', false))
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  url?: string;

  @ApiPropertyOptional(apiPropertyPresets.string('페이지 제목', 'Page Title', { required: false }))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pageTitle?: string;
}

/**
 * 코멘트 스레드 수정 요청 DTO
 * 기존 코멘트 스레드를 수정할 때 사용되는 요청 데이터
 */
export class UpdateCommentThreadRequestDto {
  @ApiPropertyOptional(apiPropertyPresets.url('스레드 URL', false))
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  url?: string;

  @ApiPropertyOptional(
    apiPropertyPresets.string('페이지 제목', 'Updated Page Title', { required: false }),
  )
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pageTitle?: string;

  @ApiPropertyOptional(apiPropertyPresets.boolean('해결 상태', false))
  @IsOptional()
  @IsBoolean()
  isResolved?: boolean;
}

// ProjectSession Request DTOs
/**
 * 커서 위치 요청 DTO
 * 사용자 커서의 화면 상 위치 좌표를 나타내는 데이터
 */
export class CursorPositionRequestDto implements CursorPosition {
  @ApiProperty(apiPropertyPresets.number('X 좌표', 100, { minimum: 0 }))
  @IsNumber()
  @Min(0)
  x: number;

  @ApiProperty(apiPropertyPresets.number('Y 좌표', 200, { minimum: 0 }))
  @IsNumber()
  @Min(0)
  y: number;
}

/**
 * 커서 위치 업데이트 요청 DTO
 * 사용자 커서 위치를 업데이트할 때 사용되는 요청 데이터
 */
export class UpdateCursorPositionRequestDto {
  @ApiProperty({ type: CursorPositionRequestDto, description: '커서 위치' })
  @IsObject()
  @ValidateNested()
  @Type(() => CursorPositionRequestDto)
  cursorPosition: CursorPositionRequestDto;
}

/**
 * 프로젝트 세션 참여 요청 DTO
 * 프로젝트 협업 세션에 참여할 때 사용되는 요청 데이터
 */
export class JoinProjectSessionRequestDto {
  @ApiProperty(apiPropertyPresets.username())
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  username: string;

  @ApiPropertyOptional(apiPropertyPresets.email(false))
  @IsOptional()
  @IsEmail()
  userEmail?: string;

  @ApiPropertyOptional(apiPropertyPresets.avatar())
  @IsOptional()
  @IsUrl()
  userAvatar?: string;
}
