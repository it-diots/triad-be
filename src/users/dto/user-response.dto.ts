import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

import { AuthProvider, UserRole, UserStatus } from '../entities/user.entity';

@Exclude()
export class UserResponseDto {
  @ApiProperty({
    description: '사용자 고유 식별자 (UUID)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: '사용자 이메일 주소',
    type: String,
    format: 'email',
    example: 'user@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: '사용자명',
    type: String,
    example: 'johndoe',
  })
  @Expose()
  username: string;

  @ApiProperty({
    description: '사용자 이름',
    type: String,
    example: 'John',
    required: false,
    nullable: true,
  })
  @Expose()
  firstName?: string;

  @ApiProperty({
    description: '사용자 성',
    type: String,
    example: 'Doe',
    required: false,
    nullable: true,
  })
  @Expose()
  lastName?: string;

  @ApiProperty({
    description: '프로필 이미지 URL',
    type: String,
    format: 'url',
    example: 'https://example.com/avatar.jpg',
    required: false,
    nullable: true,
  })
  @Expose()
  avatar?: string;

  @ApiProperty({
    description: '사용자 역할',
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.USER,
  })
  @Expose()
  role: UserRole;

  @ApiProperty({
    description: '계정 상태',
    enum: UserStatus,
    enumName: 'UserStatus',
    example: UserStatus.ACTIVE,
  })
  @Expose()
  status: UserStatus;

  @ApiProperty({
    description: '인증 제공자',
    enum: AuthProvider,
    enumName: 'AuthProvider',
    example: AuthProvider.LOCAL,
  })
  @Expose()
  provider: AuthProvider;

  @ApiProperty({
    description: '이메일 인증 일시',
    type: Date,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
    nullable: true,
  })
  @Expose()
  emailVerifiedAt?: Date;

  @ApiProperty({
    description: '마지막 로그인 일시',
    type: Date,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
    nullable: true,
  })
  @Expose()
  lastLoginAt?: Date;

  @ApiProperty({
    description: '계정 생성 일시',
    type: Date,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: '계정 정보 수정 일시',
    type: Date,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt: Date;
}
