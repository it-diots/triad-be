import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: '갱신할 리프레시 토큰 (JWT 형식)',
    type: String,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: '리프레시 토큰은 필수 항목입니다' })
  @IsJWT({ message: '유효한 JWT 형식이 아닙니다' })
  refreshToken: string;
}
