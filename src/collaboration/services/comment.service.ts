import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Comment as CommentEntity } from '../entities/comment.entity';
import { Comment, CreateCommentDto } from '../types/collaboration.types';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 코멘트 생성
   */
  async createComment(
    projectId: string,
    userId: string,
    _username: string,
    data: CreateCommentDto,
  ): Promise<Comment> {
    try {
      // 새 코멘트 생성
      const newComment = this.commentRepository.create({
        projectId,
        userId,
        content: data.content,
        position: data.position,
        parentId: data.parent_id,
        isResolved: false,
      });

      const savedComment = await this.commentRepository.save(newComment);

      // 사용자 정보와 함께 조회
      const commentWithUser = await this.commentRepository.findOne({
        where: { id: savedComment.id },
        relations: ['user'],
      });

      if (!commentWithUser) {
        throw new Error('Failed to retrieve created comment');
      }

      // Socket.io Gateway로 이벤트 전파
      this.eventEmitter.emit('comment.created', {
        projectId,
        comment: this.mapToLegacyFormat(commentWithUser),
        userId,
        timestamp: new Date(),
      });

      this.logger.log(`새 코멘트 생성: ${savedComment.id}`);
      return Promise.resolve(this.mapToLegacyFormat(commentWithUser));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`코멘트 생성 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 코멘트 삭제
   */
  async deleteComment(projectId: string, commentId: string, userId: string): Promise<void> {
    try {
      const comment = await this.commentRepository.findOne({
        where: { id: commentId, projectId, userId },
      });

      if (!comment) {
        throw new NotFoundException('코멘트를 찾을 수 없거나 권한이 없습니다');
      }

      await this.commentRepository.softDelete(commentId);

      // Socket.io Gateway로 이벤트 전파
      this.eventEmitter.emit('comment.deleted', {
        projectId,
        commentId,
        userId,
        timestamp: new Date(),
      });

      this.logger.log(`코멘트 삭제: ${commentId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`코멘트 삭제 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 코멘트 해결 상태 토글
   */
  async toggleCommentResolved(
    projectId: string,
    commentId: string,
    userId: string,
  ): Promise<Comment> {
    try {
      const comment = await this.commentRepository.findOne({
        where: { id: commentId, projectId },
        relations: ['user'],
      });

      if (!comment) {
        throw new NotFoundException('코멘트를 찾을 수 없습니다');
      }

      // 해결 상태 토글
      comment.isResolved = !comment.isResolved;
      comment.resolvedAt = comment.isResolved ? new Date() : undefined;
      comment.resolvedBy = comment.isResolved ? userId : undefined;

      const updatedComment = await this.commentRepository.save(comment);

      // Socket.io Gateway로 이벤트 전파
      this.eventEmitter.emit('comment.resolved', {
        projectId,
        comment: this.mapToLegacyFormat(updatedComment),
        userId,
        timestamp: new Date(),
      });

      this.logger.log(`코멘트 상태 업데이트: ${commentId} - 해결: ${comment.isResolved}`);
      return Promise.resolve(this.mapToLegacyFormat(updatedComment));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`코멘트 상태 업데이트 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 코멘트 수정
   */
  async updateComment(
    projectId: string,
    commentId: string,
    userId: string,
    content: string,
  ): Promise<Comment> {
    try {
      const comment = await this.commentRepository.findOne({
        where: { id: commentId, projectId, userId },
        relations: ['user'],
      });

      if (!comment) {
        throw new NotFoundException('코멘트를 찾을 수 없거나 권한이 없습니다');
      }

      // 코멘트 내용 수정
      comment.content = content;
      const updatedComment = await this.commentRepository.save(comment);

      // Socket.io Gateway로 이벤트 전파
      this.eventEmitter.emit('comment.updated', {
        projectId,
        comment: this.mapToLegacyFormat(updatedComment),
        userId,
        timestamp: new Date(),
      });

      this.logger.log(`코멘트 수정: ${commentId}`);
      return Promise.resolve(this.mapToLegacyFormat(updatedComment));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`코멘트 수정 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 프로젝트의 모든 코멘트 조회
   */
  async getProjectComments(projectId: string): Promise<Comment[]> {
    try {
      const comments = await this.commentRepository.find({
        where: { projectId },
        relations: ['user', 'replies'],
        order: { createdAt: 'DESC' },
      });

      // 생성일시 기준 내림차순 정렬
      return Promise.resolve(comments.map((comment) => this.mapToLegacyFormat(comment)));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`코멘트 조회 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 특정 코멘트 조회
   * @param projectId - 프로젝트 ID
   * @param commentId - 코멘트 ID
   * @returns 코멘트 정보 또는 null
   */
  async getCommentById(projectId: string, commentId: string): Promise<Comment | null> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, projectId },
      relations: ['user'],
    });

    return comment ? this.mapToLegacyFormat(comment) : null;
  }

  /**
   * 프로젝트 정리 - 프로젝트의 모든 코멘트 삭제 (Soft Delete)
   * @param projectId - 프로젝트 ID
   * @returns void
   */
  async cleanupProject(projectId: string): Promise<void> {
    await this.commentRepository.softDelete({ projectId });
    this.logger.log(`프로젝트 ${projectId}의 모든 코멘트 정리 완료`);
  }

  /**
   * Entity를 Legacy 형식으로 변환
   */
  private mapToLegacyFormat(comment: CommentEntity): Comment {
    return {
      id: comment.id,
      project_id: comment.projectId,
      user_id: comment.userId,
      userId: comment.userId,
      username: comment.user?.username || '',
      content: comment.content,
      position: comment.position,
      parent_id: comment.parentId,
      is_resolved: comment.isResolved,
      resolved_at: comment.resolvedAt?.toISOString(),
      resolved_by: comment.resolvedBy,
      created_at: comment.createdAt.toISOString(),
      updated_at: comment.updatedAt.toISOString(),
    };
  }
}
