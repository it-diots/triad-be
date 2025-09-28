import { ApiProperty } from '@nestjs/swagger';

import { PaginatedResponseDto } from '../../common/dto/base-response.dto';

import { UserResponseDto } from './user-response.dto';

/**
 * 사용자 목록 응답 DTO
 * 페이지네이션된 사용자 목록을 반환할 때 사용
 */
export class UserListResponseDto extends PaginatedResponseDto<UserResponseDto> {
  /**
   * 사용자 목록
   */
  @ApiProperty({
    description: '사용자 목록',
    type: [UserResponseDto],
    isArray: true,
  })
  declare data: UserResponseDto[];
}
