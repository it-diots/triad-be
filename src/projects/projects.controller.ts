import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Project } from '../collaboration/entities/project.entity';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
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
  @ApiCreatedResponse({ description: '프로젝트가 성공적으로 생성되었습니다', type: Project })
  create(
    @Body() createProjectDto: CreateProjectDto,
    @Req() req: RequestWithUser,
  ): Promise<Project> {
    return this.projectsService.create(createProjectDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: '내 프로젝트 목록 조회' })
  @ApiOkResponse({ description: '프로젝트 목록', type: [Project] })
  findAll(@Req() req: RequestWithUser): Promise<Project[]> {
    return this.projectsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '프로젝트 상세 조회' })
  @ApiOkResponse({ description: '프로젝트 정보', type: Project })
  findOne(@Param('id') id: string): Promise<Project> {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '프로젝트 수정' })
  @ApiOkResponse({ description: '프로젝트가 성공적으로 수정되었습니다', type: Project })
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Req() req: RequestWithUser,
  ): Promise<Project> {
    return this.projectsService.update(id, updateProjectDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '프로젝트 삭제' })
  @ApiOkResponse({ description: '프로젝트가 성공적으로 삭제되었습니다' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<void> {
    return this.projectsService.remove(id, req.user.id);
  }

  @Post('by-url')
  @ApiOperation({ summary: 'URL로 프로젝트 조회 또는 생성' })
  @ApiCreatedResponse({ description: '프로젝트 정보', type: Project })
  findOrCreateByUrl(@Body('url') url: string, @Req() req: RequestWithUser): Promise<Project> {
    return this.projectsService.findOrCreateByUrl(url, req.user.id);
  }
}
