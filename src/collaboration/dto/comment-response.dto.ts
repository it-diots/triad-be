import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from '../../users/dto/user-response.dto';

export class CommentResponseDto {
  @ApiProperty({
    description: '코멘트 고유 식별자 (UUID)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '코멘트 내용',
    type: String,
    example: '이 부분을 수정하면 좋을 것 같습니다.',
  })
  content: string;

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
    description: '페이지 URL',
    type: String,
    format: 'url',
    example: 'https://example.com/page',
  })
  pageUrl: string;

  @ApiProperty({
    description: 'DOM 선택자',
    type: String,
    example: '#main-content > div.header',
    required: false,
    nullable: true,
  })
  selector?: string;

  @ApiProperty({
    description: '프로젝트 ID',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  projectId: string;

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
    description: '스레드 ID',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
    nullable: true,
  })
  threadId?: string;

  @ApiProperty({
    description: '부모 코멘트 ID (답글인 경우)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
    nullable: true,
  })
  parentId?: string;

  @ApiProperty({
    description: '해결 여부',
    type: Boolean,
    example: false,
  })
  resolved: boolean;

  @ApiProperty({
    description: '코멘트 작성 일시',
    type: Date,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '코멘트 수정 일시',
    type: Date,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: '코멘트 삭제 일시 (soft delete)',
    type: Date,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
    nullable: true,
  })
  deletedAt?: Date;
}
