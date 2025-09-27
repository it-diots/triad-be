import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from '../../users/dto/user-response.dto';

export enum MutationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  MOVE = 'MOVE',
}

export class MutationResponseDto {
  @ApiProperty({
    description: '변경사항 고유 식별자 (UUID)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '프로젝트 ID',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  projectId: string;

  @ApiProperty({
    description: '사용자 ID',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: '사용자 정보',
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: '변경 유형',
    enum: MutationType,
    enumName: 'MutationType',
    example: MutationType.CREATE,
  })
  type: MutationType;

  @ApiProperty({
    description: '대상 엔티티 유형 (comment, thread 등)',
    type: String,
    example: 'comment',
  })
  targetType: string;

  @ApiProperty({
    description: '대상 엔티티 ID',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  targetId: string;

  @ApiProperty({
    description: '이전 상태 데이터',
    type: Object,
    example: { content: 'Old content' },
    required: false,
    nullable: true,
  })
  previousData?: Record<string, unknown>;

  @ApiProperty({
    description: '새로운 상태 데이터',
    type: Object,
    example: { content: 'New content' },
    required: false,
    nullable: true,
  })
  newData?: Record<string, unknown>;

  @ApiProperty({
    description: '페이지 URL',
    type: String,
    format: 'url',
    example: 'https://example.com/page',
    required: false,
    nullable: true,
  })
  pageUrl?: string;

  @ApiProperty({
    description: '메타데이터',
    type: Object,
    example: { browser: 'Chrome', version: '120.0' },
    required: false,
    nullable: true,
  })
  metadata?: Record<string, unknown>;

  @ApiProperty({
    description: '변경 발생 일시',
    type: Date,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;
}
