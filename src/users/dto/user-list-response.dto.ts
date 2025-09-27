import { ApiProperty } from '@nestjs/swagger';

import { PaginatedResponseDto } from '../../common/dto/base-response.dto';

import { UserResponseDto } from './user-response.dto';

export class UserListResponseDto extends PaginatedResponseDto<UserResponseDto> {
  @ApiProperty({
    description: '사용자 목록',
    type: [UserResponseDto],
    isArray: true,
  })
  declare data: UserResponseDto[];
}
