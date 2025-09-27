import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from '../../users/dto/user-response.dto';

export class ProjectSettingsDto {
  @ApiProperty({
    description: '코멘트 허용 여부',
    type: Boolean,
    example: true,
  })
  allowComments: boolean;

  @ApiProperty({
    description: '게스트 허용 여부',
    type: Boolean,
    example: false,
  })
  allowGuests: boolean;

  @ApiProperty({
    description: '최대 참여자 수',
    type: Number,
    example: 50,
    required: false,
    nullable: true,
  })
  maxParticipants?: number;

  @ApiProperty({
    description: '프로젝트 공개 여부',
    type: Boolean,
    example: false,
  })
  isPublic: boolean;
}

export class ProjectResponseDto {
  @ApiProperty({
    description: '프로젝트 고유 식별자 (UUID)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '프로젝트 이름',
    type: String,
    example: 'My Awesome Project',
  })
  name: string;

  @ApiProperty({
    description: '프로젝트 설명',
    type: String,
    example: '실시간 웹 협업 도구 프로젝트입니다',
    required: false,
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: '프로젝트 대상 웹사이트 URL',
    type: String,
    format: 'url',
    example: 'https://example.com',
    required: false,
    nullable: true,
  })
  url?: string;

  @ApiProperty({
    description: '프로젝트 도메인',
    type: String,
    example: 'example.com',
    required: false,
    nullable: true,
  })
  domain?: string;

  @ApiProperty({
    description: '프로젝트 공개 여부',
    type: Boolean,
    example: false,
  })
  isPublic: boolean;

  @ApiProperty({
    description: '프로젝트 소유자 ID',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  ownerId: string;

  @ApiProperty({
    description: '프로젝트 소유자 정보',
    type: UserResponseDto,
  })
  owner: UserResponseDto;

  @ApiProperty({
    description: '프로젝트 설정',
    type: ProjectSettingsDto,
    required: false,
    nullable: true,
  })
  settings?: ProjectSettingsDto;

  @ApiProperty({
    description: '프로젝트 생성 일시',
    type: Date,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '프로젝트 수정 일시',
    type: Date,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: '프로젝트 삭제 일시 (soft delete)',
    type: Date,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
    nullable: true,
  })
  deletedAt?: Date;
}
