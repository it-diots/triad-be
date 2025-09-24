/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-nocheck
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import {
  Comment,
  CreateCommentDto,
  MousePosition,
  MouseTrailDto,
  ProjectSession,
} from '../types/collaboration.types';

class CursorPositionDto implements MousePosition {
  @ApiProperty({ description: '커서의 X 좌표 (뷰포트 기준)' })
  x: number;

  @ApiProperty({ description: '커서의 Y 좌표 (뷰포트 기준)' })
  y: number;

  @ApiPropertyOptional({ description: '뷰포트 기준 X 좌표', type: Number })
  viewport_x?: number;

  @ApiPropertyOptional({ description: '뷰포트 기준 Y 좌표', type: Number })
  viewport_y?: number;

  @ApiPropertyOptional({ description: '페이지 URL' })
  page_url?: string;

  @ApiPropertyOptional({ description: 'DOM Element XPath 또는 CSS Selector' })
  element_path?: string;
}

class CursorVelocityDto {
  @ApiProperty({ description: 'X 방향 속도 (px/ms)' })
  dx: number;

  @ApiProperty({ description: 'Y 방향 속도 (px/ms)' })
  dy: number;
}

export class UpdateCursorRequestDto {
  @ApiProperty({ type: CursorPositionDto })
  @Type(() => CursorPositionDto)
  position: CursorPositionDto;

  @ApiPropertyOptional({ type: CursorVelocityDto })
  @Type(() => CursorVelocityDto)
  velocity?: CursorVelocityDto;

  @ApiPropertyOptional({ description: '커서 색상 (hex)' })
  color?: string;
}

export class MouseTrailPointDto implements MousePosition {
  @ApiProperty()
  x: number;

  @ApiProperty()
  y: number;

  @ApiPropertyOptional({ type: Number })
  viewport_x?: number;

  @ApiPropertyOptional({ type: Number })
  viewport_y?: number;

  @ApiPropertyOptional()
  page_url?: string;

  @ApiPropertyOptional()
  element_path?: string;
}

export class UpdateCursorBatchRequestDto implements MouseTrailDto {
  @ApiProperty({ type: [MouseTrailPointDto] })
  @Type(() => MouseTrailPointDto)
  trail: MouseTrailPointDto[];

  @ApiPropertyOptional({ description: '배치 크기' })
  batchSize?: number;
}

export class MouseClickRequestDto {
  @ApiProperty({ type: CursorPositionDto })
  @Type(() => CursorPositionDto)
  position: CursorPositionDto;

  @ApiPropertyOptional({ enum: ['left', 'right', 'middle'], default: 'left' })
  clickType?: 'left' | 'right' | 'middle';
}

export class UpdateActivityRequestDto {
  @ApiProperty({ description: '활성 상태 여부' })
  isActive: boolean;
}

class CommentPositionDto {
  @ApiProperty({ description: 'X 좌표' })
  x: number;

  @ApiProperty({ description: 'Y 좌표' })
  y: number;
}

export class CreateCommentRequestDto implements CreateCommentDto {
  @ApiProperty({ description: '코멘트 내용' })
  content: string;

  @ApiProperty({ type: CommentPositionDto, description: '코멘트를 남길 좌표' })
  @Type(() => CommentPositionDto)
  position: CommentPositionDto;

  @ApiPropertyOptional({ description: '부모 코멘트 ID (답글일 경우)' })
  parent_id?: string;
}

export class CommentResponseDto implements Comment {
  @ApiProperty()
  id: string;

  @ApiProperty()
  project_id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty({ description: '사용자 ID (snake_case 호환)' })
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ type: CommentPositionDto })
  position: CommentPositionDto;

  @ApiPropertyOptional({ description: '부모 코멘트 ID' })
  parent_id?: string;

  @ApiProperty({ description: '해결 여부' })
  is_resolved: boolean;

  @ApiPropertyOptional({ description: '해결 일시 (ISO8601)' })
  resolved_at?: string;

  @ApiPropertyOptional({ description: '해결한 사용자 ID' })
  resolved_by?: string;

  @ApiProperty({ description: '생성 일시 (ISO8601)' })
  created_at: string;

  @ApiPropertyOptional({ description: '수정 일시 (ISO8601)' })
  updated_at?: string;
}

export class JoinProjectResponseDto {
  @ApiProperty({ description: '요청 성공 여부' })
  success: boolean;

  @ApiProperty({ description: '프로젝트 ID' })
  projectId: string;

  @ApiProperty({ description: 'Realtime 채널 이름' })
  channelName: string;

  @ApiProperty({ description: '생성된 세션 ID' })
  sessionId: string;
}

export class MutationProcessingResponseDto {
  @ApiProperty({ description: '처리 성공 여부' })
  success: boolean;

  @ApiProperty({ description: '처리된 mutation 개수' })
  processedMutations: number;
}

export class ProjectSessionResponseDto implements ProjectSession {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional()
  userEmail?: string;

  @ApiPropertyOptional()
  userAvatar?: string;

  @ApiProperty({ description: '참가 일시' })
  joinedAt: Date;

  @ApiProperty({ description: '마지막 활동 일시' })
  lastActivity: Date;

  @ApiProperty({ description: '활성 여부' })
  isActive: boolean;

  @ApiPropertyOptional({ type: CommentPositionDto, description: '최근 커서 위치', nullable: true })
  cursorPosition: CommentPositionDto | null;

  @ApiPropertyOptional()
  project_id?: string;

  @ApiPropertyOptional()
  user_id?: string;

  @ApiPropertyOptional({ type: CommentPositionDto })
  cursor_position?: CommentPositionDto;

  @ApiPropertyOptional()
  is_active?: boolean;

  @ApiPropertyOptional()
  joined_at?: string;

  @ApiPropertyOptional()
  last_activity?: string;

  @ApiPropertyOptional()
  created_at?: string;

  @ApiPropertyOptional()
  updated_at?: string;
}

export class CommentThreadResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: '프로젝트 ID' })
  projectId: string;

  @ApiProperty({ description: '단축 ID' })
  shortId: string;

  @ApiPropertyOptional({ description: '노드 ID' })
  nodeId?: string;

  @ApiProperty({ description: 'X 좌표' })
  x: number;

  @ApiProperty({ description: 'Y 좌표' })
  y: number;

  @ApiPropertyOptional({ description: '페이지 URL' })
  page?: string;

  @ApiPropertyOptional({ description: '페이지 제목' })
  pageTitle?: string;

  @ApiPropertyOptional({ description: '사용자 에이전트' })
  userAgent?: string;

  @ApiPropertyOptional({ description: '스크린 너비' })
  screenWidth?: number;

  @ApiPropertyOptional({ description: '스크린 높이' })
  screenHeight?: number;

  @ApiPropertyOptional({ description: '디바이스 픽셀 비율' })
  devicePixelRatio?: number;

  @ApiPropertyOptional({ description: '배포 URL' })
  deploymentUrl?: string;

  @ApiPropertyOptional({ description: '드래프트 모드 여부' })
  draftMode?: boolean;

  @ApiProperty({ description: '현재 상태' })
  status: string;
}

export const CollaborationDocsModels = [
  CursorPositionDto,
  CursorVelocityDto,
  UpdateCursorRequestDto,
  MouseTrailPointDto,
  UpdateCursorBatchRequestDto,
  MouseClickRequestDto,
  UpdateActivityRequestDto,
  CreateCommentRequestDto,
  CommentResponseDto,
  JoinProjectResponseDto,
  MutationProcessingResponseDto,
  ProjectSessionResponseDto,
  CommentThreadResponseDto,
];
