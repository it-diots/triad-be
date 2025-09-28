import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateProjectRequestDto,
  ProjectSearchRequestDto,
  UpdateProjectRequestDto,
} from '../common/dto/request.dto';
import { ProjectListResponseDto, ProjectResponseDto } from '../common/dto/response.dto';

import { ProjectsService } from './projects.service';

import type { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    username: string;
  };
}

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: '프로젝트 생성' })
  @ApiCreatedResponse({
    description: '프로젝트가 성공적으로 생성되었습니다',
    type: ProjectResponseDto,
  })
  createAndTransform(
    @Body() createProjectDto: CreateProjectRequestDto,
    @Req() req: RequestWithUser,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.createAndTransform(createProjectDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: '프로젝트 목록 조회 (검색 및 필터링 지원)' })
  @ApiOkResponse({ description: '프로젝트 목록', type: ProjectListResponseDto })
  findAllWithSearch(
    @Query() searchDto: ProjectSearchRequestDto,
    @Req() req: RequestWithUser,
  ): Promise<ProjectListResponseDto> {
    return this.projectsService.findAllWithSearch(searchDto, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '프로젝트 상세 조회' })
  @ApiOkResponse({ description: '프로젝트 정보', type: ProjectResponseDto })
  findOneAndTransform(@Param('id') id: string): Promise<ProjectResponseDto> {
    return this.projectsService.findOneAndTransform(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '프로젝트 수정' })
  @ApiOkResponse({ description: '프로젝트가 성공적으로 수정되었습니다', type: ProjectResponseDto })
  updateAndTransform(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectRequestDto,
    @Req() req: RequestWithUser,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.updateAndTransform(id, updateProjectDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '프로젝트 삭제' })
  @ApiOkResponse({ description: '프로젝트가 성공적으로 삭제되었습니다' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<void> {
    return this.projectsService.remove(id, req.user.id);
  }

  @Post('by-url')
  @ApiOperation({ summary: 'URL로 프로젝트 조회 또는 생성' })
  @ApiCreatedResponse({ description: '프로젝트 정보', type: ProjectResponseDto })
  findOrCreateByUrlAndTransform(
    @Body('url') url: string,
    @Req() req: RequestWithUser,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.findOrCreateByUrlAndTransform(url, req.user.id);
  }
}
