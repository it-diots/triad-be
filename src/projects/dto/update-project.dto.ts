import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

import { CreateProjectDto } from './create-project.dto';

/**
 * 프로젝트 수정 DTO
 * 기존 프로젝트 정보를 업데이트할 때 사용
 */
export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiProperty({
    description: '프로젝트 설정',
    type: Object,
    example: {
      allowComments: true,
      allowGuests: false,
      maxParticipants: 50,
      isPublic: false,
    },
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  settings?: {
    allowComments: boolean;
    allowGuests: boolean;
    maxParticipants?: number;
    isPublic: boolean;
  };
}
