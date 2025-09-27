import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: '사용자 이메일 주소 (고유값)',
    type: String,
    format: 'email',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  @IsNotEmpty({ message: '이메일은 필수 항목입니다' })
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  email: string;

  @ApiProperty({
    description: '사용자 비밀번호 (최소 8자, 대소문자, 숫자, 특수문자 포함)',
    type: String,
    format: 'password',
    example: 'Password123!',
    required: true,
    minLength: 8,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: '비밀번호는 필수 항목입니다' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  @MaxLength(50, { message: '비밀번호는 최대 50자까지 가능합니다' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '비밀번호는 대문자, 소문자, 숫자, 특수문자를 각각 하나 이상 포함해야 합니다',
  })
  password: string;

  @ApiProperty({
    description: '사용자명 (3-20자, 영문자, 숫자, 언더스코어, 하이픈만 허용, 고유값)',
    type: String,
    example: 'johndoe',
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: '^[a-zA-Z0-9_-]+$',
  })
  @IsString()
  @IsNotEmpty({ message: '사용자명은 필수 항목입니다' })
  @MinLength(3, { message: '사용자명은 최소 3자 이상이어야 합니다' })
  @MaxLength(20, { message: '사용자명은 최대 20자까지 가능합니다' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: '사용자명은 영문자, 숫자, 언더스코어, 하이픈만 사용 가능합니다',
  })
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  username: string;

  @ApiProperty({
    description: '사용자 이름 (선택)',
    type: String,
    example: 'John',
    required: false,
    nullable: true,
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: '이름은 최대 100자까지 가능합니다' })
  firstName?: string;

  @ApiProperty({
    description: '사용자 성 (선택)',
    type: String,
    example: 'Doe',
    required: false,
    nullable: true,
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: '성은 최대 100자까지 가능합니다' })
  lastName?: string;
}
