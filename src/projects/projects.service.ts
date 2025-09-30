import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Project } from '../collaboration/entities/project.entity';
import { ProjectSearchRequestDto } from '../common/dto/request.dto';
import { ProjectListResponseDto, ProjectResponseDto } from '../common/dto/response.dto';
import { TransformUtil } from '../common/utils/transform.util';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectSettings } from './types/projects.service.types';

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
    const settings: ProjectSettings = {
      allowComments: true,
      allowGuests: true,
      isPublic: true,
    };

    const project = this.projectRepository.create({
      ...createProjectDto,
      ownerId: userId,
      settings,
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
      relations: ['owner'],
    });

    if (!project) {
      project = await this.create(
        {
          name: new URL(url).hostname,
          url,
        },
        userId,
      );
      // 생성 후 owner 관계 로드
      project = await this.findOne(project.id);
    }

    return project;
  }

  // DTO 변환 메서드들
  /**
   * Project 엔티티를 ProjectResponseDto로 변환
   */
  toProjectResponseDto(project: Project): ProjectResponseDto {
    return TransformUtil.toProjectResponseDto(project);
  }

  /**
   * 프로젝트 목록을 검색하고 DTO로 변환하여 반환
   */
  async findAllWithSearch(
    searchDto: ProjectSearchRequestDto,
    userId: string,
  ): Promise<ProjectListResponseDto> {
    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner');

    // 소유자 필터링 (기본적으로 현재 사용자의 프로젝트만)
    if (searchDto.ownerId) {
      queryBuilder.andWhere('project.ownerId = :ownerId', { ownerId: searchDto.ownerId });
    } else {
      queryBuilder.andWhere('project.ownerId = :userId', { userId });
    }

    // 검색어 필터링
    if (searchDto.search) {
      queryBuilder.andWhere('(project.name LIKE :search OR project.description LIKE :search)', {
        search: `%${searchDto.search}%`,
      });
    }

    // 공개 여부 필터링
    if (searchDto.isPublic !== undefined) {
      queryBuilder.andWhere('project.isPublic = :isPublic', { isPublic: searchDto.isPublic });
    }

    // 도메인 필터링
    if (searchDto.domain) {
      queryBuilder.andWhere('project.domain = :domain', { domain: searchDto.domain });
    }

    // 페이지네이션
    const page = searchDto.page || 1;
    const limit = searchDto.limit || 20;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);
    queryBuilder.orderBy('project.createdAt', 'DESC');

    const [projects, total] = await queryBuilder.getManyAndCount();

    return {
      projects: projects.map((project) => this.toProjectResponseDto(project)),
      total,
      page,
      limit,
    };
  }

  /**
   * 프로젝트 생성 후 DTO로 변환하여 반환
   */
  async createAndTransform(
    createProjectDto: CreateProjectDto,
    userId: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.create(createProjectDto, userId);
    const projectWithOwner = await this.findOne(project.id);
    return this.toProjectResponseDto(projectWithOwner);
  }

  /**
   * 프로젝트 업데이트 후 DTO로 변환하여 반환
   */
  async updateAndTransform(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.update(id, updateProjectDto, userId);
    return this.toProjectResponseDto(project);
  }

  /**
   * 프로젝트 조회 후 DTO로 변환하여 반환
   */
  async findOneAndTransform(id: string): Promise<ProjectResponseDto> {
    const project = await this.findOne(id);
    return this.toProjectResponseDto(project);
  }

  /**
   * URL로 프로젝트 조회 또는 생성 후 DTO로 변환하여 반환
   */
  async findOrCreateByUrlAndTransform(url: string, userId: string): Promise<ProjectResponseDto> {
    const project = await this.findOrCreateByUrl(url, userId);
    return this.toProjectResponseDto(project);
  }
}
