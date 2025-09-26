import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Project } from '../collaboration/entities/project.entity';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  /**
   * 프로젝트 생성
   */
  create(createProjectDto: CreateProjectDto, userId: string): Promise<Project> {
    const project = this.projectRepository.create({
      ...createProjectDto,
      ownerId: userId,
      settings: {
        allowComments: true,
        allowGuests: true,
        isPublic: true,
      },
    });

    return this.projectRepository.save(project);
  }

  /**
   * 모든 프로젝트 조회 (사용자 기준)
   */
  findAll(userId: string): Promise<Project[]> {
    return this.projectRepository.find({
      where: { ownerId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 특정 프로젝트 조회
   */
  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!project) {
      throw new NotFoundException(`프로젝트를 찾을 수 없습니다: ${id}`);
    }

    return project;
  }

  /**
   * 프로젝트 수정
   */
  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<Project> {
    const project = await this.findOne(id);

    // 소유자 확인
    if (project.ownerId !== userId) {
      throw new NotFoundException('프로젝트를 수정할 권한이 없습니다');
    }

    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  /**
   * 프로젝트 삭제
   */
  async remove(id: string, userId: string): Promise<void> {
    const project = await this.findOne(id);

    // 소유자 확인
    if (project.ownerId !== userId) {
      throw new NotFoundException('프로젝트를 삭제할 권한이 없습니다');
    }

    await this.projectRepository.remove(project);
  }

  /**
   * URL로 프로젝트 조회 또는 생성
   */
  async findOrCreateByUrl(url: string, userId: string): Promise<Project> {
    let project = await this.projectRepository.findOne({
      where: { url },
    });

    if (!project) {
      project = await this.create(
        {
          name: new URL(url).hostname,
          url,
        },
        userId,
      );
    }

    return project;
  }
}
