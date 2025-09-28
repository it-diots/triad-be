import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * 로그인 요청 DTO
 * 사용자 로그인을 위한 이메일과 비밀번호 정보
 */
export class LoginDto {
  /**
   * 로그인할 사용자의 이메일 주소
   */
  @ApiProperty({
    description: '로그인할 사용자의 이메일 주소',
    type: String,
    format: 'email',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  @IsNotEmpty({ message: '이메일은 필수 항목입니다' })
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  email: string;

  /**
   * 로그인 비밀번호
   */
  @ApiProperty({
    description: '로그인 비밀번호',
    type: String,
    format: 'password',
    example: 'Password123!',
    required: true,
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: '비밀번호는 필수 항목입니다' })
  password: string;
}
