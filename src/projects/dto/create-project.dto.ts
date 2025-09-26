import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ description: '프로젝트 이름' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: '프로젝트 설명', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '프로젝트 URL', required: false })
  @IsOptional()
  @IsUrl()
  url?: string;
}
