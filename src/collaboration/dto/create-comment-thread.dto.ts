import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class DeploymentDto {
  @ApiProperty({
    description: 'Deployment ID',
    type: String,
    example: 'deploy-123',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Timestamp',
    type: Number,
    example: 1704067200000,
  })
  @IsNumber()
  ts: number;

  @ApiProperty({
    description: 'Author',
    type: String,
    example: 'john-doe',
  })
  @IsString()
  author: string;

  @ApiProperty({
    description: 'Git source information',
    type: Object,
    example: {
      type: 'github',
      branch: 'main',
      sha: 'abc123',
      commitMessage: 'feat: add new feature',
      repoId: 'repo-456',
    },
  })
  @IsObject()
  gitSource: {
    type: string;
    branch: string;
    sha: string;
    commitMessage: string;
    repoId: string;
  };
}

class FirstCommentDto {
  @ApiProperty({
    description: '코멘트 고유 ID',
    type: String,
    example: 'comment-123',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Commit SHA',
    type: String,
    example: 'abc123def456',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  commitSha?: string;

  @ApiProperty({
    description: 'Reference URL',
    type: String,
    format: 'url',
    example: 'https://example.com/page',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  href?: string;

  @ApiProperty({
    description: 'Deployment information',
    type: DeploymentDto,
    required: false,
    nullable: true,
  })
  @Type(() => DeploymentDto)
  @ValidateNested()
  @IsOptional()
  deployment?: DeploymentDto;

  @ApiProperty({
    description: '코멘트 본문 (리치 텍스트)',
    type: [Object],
    isArray: true,
    example: [{ type: 'text', content: 'Hello World' }],
  })
  @IsArray()
  body: Record<string, unknown>[];

  @ApiProperty({
    description: '코멘트 텍스트 (일반 텍스트)',
    type: String,
    example: 'This is a comment',
  })
  @IsString()
  text: string;

  @ApiProperty({
    description: '첨부 이미지 URL 목록',
    type: [String],
    isArray: true,
    example: ['https://example.com/image1.png', 'https://example.com/image2.png'],
  })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({
    description: '로컬호스트에서 작성 여부',
    type: Boolean,
    example: false,
  })
  @IsBoolean()
  leftOnLocalhost: boolean;
}

/**
 * 코멘트 스레드 생성 DTO
 * 새로운 코멘트 스레드를 생성할 때 사용되는 데이터
 */
export class CreateCommentThreadDto {
  @ApiProperty({
    description: '짧은 식별 번호',
    type: Number,
    example: 1,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  shortId?: number;

  @ApiProperty({
    description: '스레드 고유 ID',
    type: String,
    example: 'thread-123',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'DOM 노드 ID',
    type: String,
    example: 'node-456',
  })
  @IsString()
  nodeId: string;

  @ApiProperty({
    description: 'X 좌표 (0~1 정규화)',
    type: Number,
    minimum: 0,
    maximum: 1,
    example: 0.5,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  x: number;

  @ApiProperty({
    description: 'Y 좌표 (0~1 정규화)',
    type: Number,
    minimum: 0,
    maximum: 1,
    example: 0.3,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  y: number;

  @ApiProperty({
    description: '페이지 URL',
    type: String,
    example: 'https://example.com/page',
  })
  @IsString()
  page: string;

  @ApiProperty({
    description: '페이지 제목',
    type: String,
    example: 'Example Page Title',
  })
  @IsString()
  pageTitle: string;

  @ApiProperty({
    description: '사용자 에이전트 문자열',
    type: String,
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  @IsString()
  userAgent: string;

  @ApiProperty({
    description: '화면 너비 (픽셀)',
    type: Number,
    example: 1920,
  })
  @IsNumber()
  screenWidth: number;

  @ApiProperty({
    description: '화면 높이 (픽셀)',
    type: Number,
    example: 1080,
  })
  @IsNumber()
  screenHeight: number;

  @ApiProperty({
    description: '디바이스 픽셀 비율',
    type: Number,
    example: 2,
  })
  @IsNumber()
  devicePixelRatio: number;

  @ApiProperty({
    description: '배포 URL',
    type: String,
    format: 'url',
    example: 'https://example.vercel.app',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  deploymentUrl?: string;

  @ApiProperty({
    description: '초안 모드 여부',
    type: Boolean,
    example: false,
  })
  @IsBoolean()
  draftMode: boolean;

  @ApiProperty({
    description: '첫 번째 코멘트',
    type: FirstCommentDto,
  })
  @Type(() => FirstCommentDto)
  @ValidateNested()
  firstComment: FirstCommentDto;
}
