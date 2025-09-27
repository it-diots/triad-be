import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'password'] as const),
) {
  @ApiProperty({
    description: '사용자 프로필 이미지 URL',
    type: String,
    format: 'url',
    example: 'https://example.com/avatar.jpg',
    required: false,
    nullable: true,
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이 아닙니다' })
  @MaxLength(500, { message: '프로필 이미지 URL은 최대 500자까지 가능합니다' })
  avatar?: string;
}
