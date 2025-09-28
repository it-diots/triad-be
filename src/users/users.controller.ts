import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  CreateUserRequestDto,
  UpdateUserRequestDto,
  UserSearchRequestDto,
} from '../common/dto/request.dto';
import {
  UserListResponseDto,
  UserProfileResponseDto,
  UserResponseDto,
} from '../common/dto/response.dto';

import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: '사용자 생성' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  createAndTransform(@Body() createUserDto: CreateUserRequestDto): Promise<UserResponseDto> {
    return this.usersService.createAndTransform(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: '사용자 목록 조회 (검색 및 필터링 지원)' })
  @ApiResponse({ status: 200, type: UserListResponseDto })
  findAllWithSearch(@Query() searchDto: UserSearchRequestDto): Promise<UserListResponseDto> {
    return this.usersService.findAllWithSearch(searchDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '사용자 상세 조회' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOneAndTransform(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.findOneAndTransform(id);
  }

  @Get(':id/profile')
  @ApiOperation({ summary: '사용자 프로필 조회 (공개 정보만)' })
  @ApiResponse({ status: 200, type: UserProfileResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  getProfileAndTransform(@Param('id', ParseUUIDPipe) id: string): Promise<UserProfileResponseDto> {
    return this.usersService.getProfileAndTransform(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '사용자 정보 수정' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateAndTransform(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserRequestDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateAndTransform(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '사용자 삭제' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
