import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * 프로젝트 생성 DTO
 * 새로운 프로젝트를 생성할 때 필요한 정보
 */
export class CreateProjectDto {
  @ApiProperty({
    description: '프로젝트 이름',
    type: String,
    example: 'My Awesome Project',
    required: true,
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty({ message: '프로젝트 이름은 필수 항목입니다' })
  @IsString()
  @MinLength(1, { message: '프로젝트 이름은 최소 1자 이상이어야 합니다' })
  @MaxLength(255, { message: '프로젝트 이름은 최대 255자까지 가능합니다' })
  name: string;

  @ApiProperty({
    description: '프로젝트 설명',
    type: String,
    example: '실시간 웹 협업 도구 프로젝트입니다',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '프로젝트 대상 웹사이트 URL (Chrome Extension에서 사용)',
    type: String,
    format: 'url',
    example: 'https://example.com',
    required: false,
    nullable: true,
    maxLength: 500,
  })
  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이 아닙니다' })
  @MaxLength(500, { message: 'URL은 최대 500자까지 가능합니다' })
  url?: string;

  @ApiProperty({
    description: '프로젝트 공개 여부',
    type: Boolean,
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
