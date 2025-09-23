import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Comment, CreateCommentDto } from '../types/collaboration.types';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);
  private comments: Map<string, Comment[]> = new Map(); // projectId -> Comments[]
  private commentIdCounter = 0;

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * 코멘트 생성
   */
  createComment(
    projectId: string,
    userId: string,
    username: string,
    data: CreateCommentDto,
  ): Promise<Comment> {
    try {
      // 프로젝트의 코멘트 배열 초기화
      if (!this.comments.has(projectId)) {
        this.comments.set(projectId, []);
      }

      const projectComments = this.comments.get(projectId);
      if (!projectComments) {
        throw new Error('Failed to get project comments');
      }

      // 새 코멘트 생성
      const newComment: Comment = {
        id: `comment-${++this.commentIdCounter}-${Date.now()}`,
        project_id: projectId,
        user_id: userId,
        username,
        content: data.content,
        position: data.position,
        parent_id: data.parent_id,
        is_resolved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      projectComments.push(newComment);

      // Socket.io Gateway로 이벤트 전파
      this.eventEmitter.emit('comment.created', {
        projectId,
        comment: newComment,
        userId,
        timestamp: new Date(),
      });

      this.logger.log(`새 코멘트 생성: ${newComment.id}`);
      return newComment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`코멘트 생성 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 코멘트 삭제
   */
  deleteComment(projectId: string, commentId: string, userId: string): void {
    try {
      const projectComments = this.comments.get(projectId);
      if (!projectComments) {
        throw new NotFoundException('프로젝트를 찾을 수 없습니다');
      }

      const commentIndex = projectComments.findIndex(
        (c) => c.id === commentId && c.user_id === userId,
      );

      if (commentIndex === -1) {
        throw new NotFoundException('코멘트를 찾을 수 없거나 권한이 없습니다');
      }

      // 코멘트 삭제
      projectComments.splice(commentIndex, 1);

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
  toggleCommentResolved(projectId: string, commentId: string, userId: string): Promise<Comment> {
    try {
      const projectComments = this.comments.get(projectId);
      if (!projectComments) {
        throw new NotFoundException('프로젝트를 찾을 수 없습니다');
      }

      const comment = projectComments.find((c) => c.id === commentId);
      if (!comment) {
        throw new NotFoundException('코멘트를 찾을 수 없습니다');
      }

      // 해결 상태 토글
      comment.is_resolved = !comment.is_resolved;
      comment.resolved_at = comment.is_resolved ? new Date().toISOString() : undefined;
      comment.resolved_by = comment.is_resolved ? userId : undefined;
      comment.updated_at = new Date().toISOString();

      // Socket.io Gateway로 이벤트 전파
      this.eventEmitter.emit('comment.resolved', {
        projectId,
        comment,
        userId,
        timestamp: new Date(),
      });

      this.logger.log(`코멘트 상태 업데이트: ${commentId} - 해결: ${comment.is_resolved}`);
      return comment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`코멘트 상태 업데이트 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 코멘트 수정
   */
  updateComment(
    projectId: string,
    commentId: string,
    userId: string,
    content: string,
  ): Promise<Comment> {
    try {
      const projectComments = this.comments.get(projectId);
      if (!projectComments) {
        throw new NotFoundException('프로젝트를 찾을 수 없습니다');
      }

      const comment = projectComments.find((c) => c.id === commentId && c.user_id === userId);
      if (!comment) {
        throw new NotFoundException('코멘트를 찾을 수 없거나 권한이 없습니다');
      }

      // 코멘트 내용 수정
      comment.content = content;
      comment.updated_at = new Date().toISOString();

      // Socket.io Gateway로 이벤트 전파
      this.eventEmitter.emit('comment.updated', {
        projectId,
        comment,
        userId,
        timestamp: new Date(),
      });

      this.logger.log(`코멘트 수정: ${commentId}`);
      return comment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`코멘트 수정 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 프로젝트의 모든 코멘트 조회
   */
  getProjectComments(projectId: string): Comment[] {
    try {
      const projectComments = this.comments.get(projectId);
      if (!projectComments) {
        return [];
      }

      // 생성일시 기준 내림차순 정렬
      return projectComments.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`코멘트 조회 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 특정 코멘트 조회
   */
  getCommentById(projectId: string, commentId: string): Comment | null {
    const projectComments = this.comments.get(projectId);
    if (!projectComments) {
      return null;
    }

    return projectComments.find((c) => c.id === commentId) || null;
  }

  /**
   * 프로젝트 정리 (메모리 관리)
   */
  cleanupProject(projectId: string): void {
    this.comments.delete(projectId);
    this.logger.log(`프로젝트 ${projectId}의 모든 코멘트 정리 완료`);
  }
}
