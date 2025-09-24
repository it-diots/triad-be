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
  @IsString()
  id: string;

  @IsNumber()
  ts: number;

  @IsString()
  author: string;

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
  @IsString()
  id: string;

  @IsString()
  @IsOptional()
  commitSha?: string;

  @IsString()
  @IsOptional()
  href?: string;

  @Type(() => DeploymentDto)
  @ValidateNested()
  @IsOptional()
  deployment?: DeploymentDto;

  @IsArray()
  body: Record<string, unknown>[];

  @IsString()
  text: string;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsBoolean()
  leftOnLocalhost: boolean;
}

export class CreateCommentThreadDto {
  @IsNumber()
  @IsOptional()
  shortId?: number;

  @IsString()
  id: string;

  @IsString()
  nodeId: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  x: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  y: number;

  @IsString()
  page: string;

  @IsString()
  pageTitle: string;

  @IsString()
  userAgent: string;

  @IsNumber()
  screenWidth: number;

  @IsNumber()
  screenHeight: number;

  @IsNumber()
  devicePixelRatio: number;

  @IsString()
  @IsOptional()
  deploymentUrl?: string;

  @IsBoolean()
  draftMode: boolean;

  @Type(() => FirstCommentDto)
  @ValidateNested()
  firstComment: FirstCommentDto;
}
