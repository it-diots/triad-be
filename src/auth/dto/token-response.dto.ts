import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from '../../users/dto/user-response.dto';

/**
 * 토큰 응답 DTO
 * 로그인 성공 시 반환되는 토큰 정보와 사용자 데이터
 */
export class TokenResponseDto {
  /**
   * 액세스 토큰 (JWT)
   */
  @ApiProperty({
    description: '액세스 토큰 (JWT)',
    type: String,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  /**
   * 리프레시 토큰 (JWT)
   */
  @ApiProperty({
    description: '리프레시 토큰 (JWT)',
    type: String,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  /**
   * 토큰 타입 (항상 Bearer)
   */
  @ApiProperty({
    description: '토큰 타입 (항상 Bearer)',
    type: String,
    example: 'Bearer',
    default: 'Bearer',
  })
  tokenType: string = 'Bearer';

  /**
   * 액세스 토큰 만료 시간 (초 단위)
   */
  @ApiProperty({
    description: '액세스 토큰 만료 시간 (초 단위)',
    type: Number,
    example: 3600,
    minimum: 0,
  })
  expiresIn: number;

  /**
   * 로그인한 사용자 정보
   */
  @ApiProperty({
    description: '로그인한 사용자 정보',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}
