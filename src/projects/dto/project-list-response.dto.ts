import { ApiProperty } from '@nestjs/swagger';

import { PaginatedResponseDto } from '../../common/dto/base-response.dto';

import { ProjectResponseDto } from './project-response.dto';

/**
 * 프로젝트 목록 응답 DTO
 * 페이지네이션된 프로젝트 목록을 반환할 때 사용
 */
export class ProjectListResponseDto extends PaginatedResponseDto<ProjectResponseDto> {
  @ApiProperty({
    description: '프로젝트 목록',
    type: [ProjectResponseDto],
    isArray: true,
  })
  declare data: ProjectResponseDto[];
}
