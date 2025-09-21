import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

import { AuthProvider, UserRole, UserStatus } from '../entities/user.entity';

@Exclude()
export class UserResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  username: string;

  @ApiProperty()
  @Expose()
  firstName?: string;

  @ApiProperty()
  @Expose()
  lastName?: string;

  @ApiProperty()
  @Expose()
  avatar?: string;

  @ApiProperty({ enum: UserRole })
  @Expose()
  role: UserRole;

  @ApiProperty({ enum: UserStatus })
  @Expose()
  status: UserStatus;

  @ApiProperty({ enum: AuthProvider })
  @Expose()
  provider: AuthProvider;

  @ApiProperty()
  @Expose()
  emailVerifiedAt?: Date;

  @ApiProperty()
  @Expose()
  lastLoginAt?: Date;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
