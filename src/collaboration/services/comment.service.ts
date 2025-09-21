import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { SupabaseService } from '../../supabase/supabase.service';
import { CommentHelper } from '../helpers/comment.helper';
import {
  Comment,
  CreateCommentDto,
  REALTIME_EVENTS,
  SUPABASE_TABLES,
} from '../types/collaboration.types';

// Supabase 응답 타입 정의
interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * 코멘트 생성
   */
  async createComment(
    projectId: string,
    userId: string,
    username: string,
    data: CreateCommentDto,
  ): Promise<Comment> {
    try {
      const supabase = this.supabaseService.getClient();

      const newComment = {
        project_id: projectId,
        user_id: userId,
        username,
        content: data.content,
        position: data.position,
        parent_id: data.parent_id,
        is_resolved: false,
        created_at: new Date().toISOString(),
      };

      const response = (await supabase
        .from(SUPABASE_TABLES.COMMENTS)
        .insert(newComment)
        .select()
        .single()) as SupabaseResponse<Comment>;

      if (response.error || !response.data) {
        throw new BadRequestException('코멘트 생성 실패');
      }

      const channel = this.supabaseService.getProjectChannel(projectId);
      await this.supabaseService.broadcastEvent(channel, REALTIME_EVENTS.COMMENT_CREATED, {
        action: 'created',
        comment: response.data,
        user_id: userId,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`새 코멘트 생성: ${response.data.id}`);
      return response.data;
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
      const supabase = this.supabaseService.getClient();

      const response = (await supabase
        .from(SUPABASE_TABLES.COMMENTS)
        .select('*')
        .eq('id', commentId)
        .eq('user_id', userId)
        .single()) as SupabaseResponse<Comment>;

      if (response.error || !response.data) {
        throw new NotFoundException('코멘트를 찾을 수 없거나 권한이 없습니다');
      }

      const { error: deleteError } = await supabase
        .from(SUPABASE_TABLES.COMMENTS)
        .delete()
        .eq('id', commentId);

      if (deleteError) {
        throw new BadRequestException('코멘트 삭제 실패');
      }

      const channel = this.supabaseService.getProjectChannel(projectId);
      await this.supabaseService.broadcastEvent(channel, REALTIME_EVENTS.COMMENT_DELETED, {
        action: 'deleted',
        commentId,
        user_id: userId,
        timestamp: new Date().toISOString(),
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
      const comment = await CommentHelper.getCommentById(this.supabaseService, commentId);
      const updatedComment = await CommentHelper.updateCommentResolution(
        this.supabaseService,
        commentId,
        !comment.is_resolved,
      );
      await CommentHelper.broadcastCommentResolution(
        this.supabaseService,
        projectId,
        updatedComment,
        userId,
      );

      return updatedComment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`코멘트 상태 업데이트 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 프로젝트의 모든 코멘트 조회
   */
  async getProjectComments(projectId: string): Promise<Comment[]> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data: comments, error } = await supabase
        .from(SUPABASE_TABLES.COMMENTS)
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error || !comments) {
        throw new BadRequestException('코멘트 조회 실패');
      }

      return comments as Comment[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`코멘트 조회 실패: ${errorMessage}`);
      throw error;
    }
  }
}
