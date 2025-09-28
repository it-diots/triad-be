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

/**
 * 뮤테이션 생성 DTO
 * 협업 환경에서 발생하는 변경사항을 생성할 때 사용되는 데이터
 */
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
