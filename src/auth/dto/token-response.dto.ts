import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from '../../users/dto/user-response.dto';

export class TokenResponseDto {
  @ApiProperty({
    description: '액세스 토큰 (JWT)',
    type: String,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: '리프레시 토큰 (JWT)',
    type: String,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: '토큰 타입 (항상 Bearer)',
    type: String,
    example: 'Bearer',
    default: 'Bearer',
  })
  tokenType: string = 'Bearer';

  @ApiProperty({
    description: '액세스 토큰 만료 시간 (초 단위)',
    type: Number,
    example: 3600,
    minimum: 0,
  })
  expiresIn: number;

  @ApiProperty({
    description: '로그인한 사용자 정보',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}
