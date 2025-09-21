import { BadRequestException, NotFoundException } from '@nestjs/common';

import { SupabaseService } from '../../supabase/supabase.service';
import { Comment, SUPABASE_TABLES, REALTIME_EVENTS } from '../types/collaboration.types';

// Supabase 응답 타입 정의
interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export class CommentHelper {
  static async getCommentById(
    supabaseService: SupabaseService,
    commentId: string,
  ): Promise<Comment> {
    const supabase = supabaseService.getClient();
    const response = (await supabase
      .from(SUPABASE_TABLES.COMMENTS)
      .select('*')
      .eq('id', commentId)
      .single()) as SupabaseResponse<Comment>;

    if (response.error || !response.data) {
      throw new NotFoundException('코멘트를 찾을 수 없습니다');
    }

    return response.data;
  }

  static async updateCommentResolution(
    supabaseService: SupabaseService,
    commentId: string,
    isResolved: boolean,
  ): Promise<Comment> {
    const supabase = supabaseService.getClient();
    const response = (await supabase
      .from(SUPABASE_TABLES.COMMENTS)
      .update({
        is_resolved: isResolved,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .select()
      .single()) as SupabaseResponse<Comment>;

    if (response.error || !response.data) {
      throw new BadRequestException('코멘트 상태 업데이트 실패');
    }

    return response.data;
  }

  static async broadcastCommentResolution(
    supabaseService: SupabaseService,
    projectId: string,
    comment: Comment,
    userId: string,
  ): Promise<void> {
    const channel = supabaseService.getProjectChannel(projectId);
    await supabaseService.broadcastEvent(channel, REALTIME_EVENTS.COMMENT_RESOLVED, {
      action: 'resolved',
      comment,
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
  }
}
