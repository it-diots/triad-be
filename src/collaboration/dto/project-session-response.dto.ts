import { ApiProperty } from '@nestjs/swagger';

import { ProjectResponseDto } from '../../projects/dto/project-response.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONNECTED = 'DISCONNECTED',
}

export class ProjectSessionResponseDto {
  @ApiProperty({
    description: '세션 고유 식별자 (UUID)',
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
    description: '소켓 ID',
    type: String,
    example: 'socket-abc123',
  })
  socketId: string;

  @ApiProperty({
    description: '세션 상태',
    enum: SessionStatus,
    enumName: 'SessionStatus',
    example: SessionStatus.ACTIVE,
  })
  status: SessionStatus;

  @ApiProperty({
    description: '현재 페이지 URL',
    type: String,
    format: 'url',
    example: 'https://example.com/page',
    required: false,
    nullable: true,
  })
  currentPageUrl?: string;

  @ApiProperty({
    description: '마지막 커서 X 좌표',
    type: Number,
    example: 500,
    required: false,
    nullable: true,
  })
  lastCursorX?: number;

  @ApiProperty({
    description: '마지막 커서 Y 좌표',
    type: Number,
    example: 300,
    required: false,
    nullable: true,
  })
  lastCursorY?: number;

  @ApiProperty({
    description: '사용자 색상 (헥사 코드)',
    type: String,
    example: '#FF5733',
  })
  userColor: string;

  @ApiProperty({
    description: '세션 메타데이터',
    type: Object,
    example: {
      browser: 'Chrome',
      os: 'Windows',
      screenResolution: '1920x1080',
    },
    required: false,
    nullable: true,
  })
  metadata?: Record<string, unknown>;

  @ApiProperty({
    description: '세션 시작 시간',
    type: Date,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
  })
  connectedAt: Date;

  @ApiProperty({
    description: '마지막 활동 시간',
    type: Date,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
  })
  lastActivityAt: Date;

  @ApiProperty({
    description: '세션 종료 시간',
    type: Date,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
    nullable: true,
  })
  disconnectedAt?: Date;
}
