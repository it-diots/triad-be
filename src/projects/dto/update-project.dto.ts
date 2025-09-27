import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

import { CreateProjectDto } from './create-project.dto';

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
