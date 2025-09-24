import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

import { CreateCommentThreadDto } from './create-comment-thread.dto';

class MutationArgsDto {
  @Type(() => CreateCommentThreadDto)
  @ValidateNested()
  @IsOptional()
  createCommentThread?: CreateCommentThreadDto;

  // 다른 mutation 타입들을 위한 확장 가능
  [key: string]: unknown;
}

class MutationDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsObject()
  args: MutationArgsDto | Record<string, unknown>;

  @IsNumber()
  timestamp: number;
}

export class CreateMutationDto {
  @IsString()
  profileID: string;

  @IsString()
  clientID: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MutationDto)
  mutations: MutationDto[];

  @IsNumber()
  @IsOptional()
  pushVersion?: number;

  @IsString()
  @IsOptional()
  schemaVersion?: string;
}
