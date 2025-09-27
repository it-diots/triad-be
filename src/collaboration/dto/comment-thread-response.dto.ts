import { ApiProperty } from '@nestjs/swagger';

import { ProjectResponseDto } from '../../projects/dto/project-response.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';

import { CommentResponseDto } from './comment-response.dto';

export enum CommentThreadStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export class CommentThreadResponseDto {
  @ApiProperty({
    description: '스레드 고유 식별자 (UUID)',
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
    description: '프로젝트 정보',
    type: ProjectResponseDto,
  })
  project: ProjectResponseDto;

  @ApiProperty({
    description: '작성자 ID',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  authorId: string;

  @ApiProperty({
    description: '작성자 정보',
    type: UserResponseDto,
  })
  author: UserResponseDto;

  @ApiProperty({
    description: '페이지 URL',
    type: String,
    format: 'url',
    example: 'https://example.com/page',
  })
  pageUrl: string;

  @ApiProperty({
    description: '페이지 제목',
    type: String,
    example: 'Example Page Title',
  })
  pageTitle: string;

  @ApiProperty({
    description: 'X 좌표 (0~1 정규화)',
    type: Number,
    minimum: 0,
    maximum: 1,
    example: 0.5,
  })
  x: number;

  @ApiProperty({
    description: 'Y 좌표 (0~1 정규화)',
    type: Number,
    minimum: 0,
    maximum: 1,
    example: 0.3,
  })
  y: number;

  @ApiProperty({
    description: 'DOM 노드 ID',
    type: String,
    example: 'node-456',
  })
  nodeId: string;

  @ApiProperty({
    description: '스레드 상태',
    enum: CommentThreadStatus,
    enumName: 'CommentThreadStatus',
    example: CommentThreadStatus.OPEN,
  })
  status: CommentThreadStatus;

  @ApiProperty({
    description: '스레드 메타데이터',
    type: Object,
    example: {
      screenWidth: 1920,
      screenHeight: 1080,
      devicePixelRatio: 2,
      userAgent: 'Mozilla/5.0...',
    },
    required: false,
    nullable: true,
  })
  metadata?: Record<string, unknown>;

  @ApiProperty({
    description: '스레드의 코멘트 목록',
    type: [CommentResponseDto],
    isArray: true,
  })
  comments: CommentResponseDto[];

  @ApiProperty({
    description: '스레드 생성 일시',
    type: Date,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '스레드 수정 일시',
    type: Date,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: '스레드 삭제 일시 (soft delete)',
    type: Date,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
    nullable: true,
  })
  deletedAt?: Date;
}
