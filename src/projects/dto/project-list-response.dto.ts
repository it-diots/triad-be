import { ApiProperty } from '@nestjs/swagger';

import { PaginatedResponseDto } from '../../common/dto/base-response.dto';

import { ProjectResponseDto } from './project-response.dto';

export class ProjectListResponseDto extends PaginatedResponseDto<ProjectResponseDto> {
  @ApiProperty({
    description: '프로젝트 목록',
    type: [ProjectResponseDto],
    isArray: true,
  })
  declare data: ProjectResponseDto[];
}
