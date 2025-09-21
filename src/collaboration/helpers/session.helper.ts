import { BadRequestException } from '@nestjs/common';

import { SupabaseService } from '../../supabase/supabase.service';
import { ProjectSession, JoinProjectDto, SUPABASE_TABLES } from '../types/collaboration.types';

// Supabase 응답 타입 정의
interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export class SessionHelper {
  static async handleUserSession(
    supabaseService: SupabaseService,
    projectId: string,
    userId: string,
    userInfo: JoinProjectDto,
  ): Promise<string> {
    const supabase = supabaseService.getClient();

    const response = (await supabase
      .from(SUPABASE_TABLES.PROJECT_SESSIONS)
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()) as SupabaseResponse<ProjectSession>;

    if (response.data) {
      return this.updateExistingSession(supabaseService, response.data, userInfo);
    } else {
      return this.createNewSession(supabaseService, projectId, userId, userInfo);
    }
  }

  static async updateExistingSession(
    supabaseService: SupabaseService,
    existingSession: ProjectSession,
    userInfo: JoinProjectDto,
  ): Promise<string> {
    const supabase = supabaseService.getClient();
    const response = (await supabase
      .from(SUPABASE_TABLES.PROJECT_SESSIONS)
      .update({
        is_active: true,
        last_activity: new Date().toISOString(),
        user_info: userInfo,
      })
      .eq('id', existingSession.id)
      .select()
      .single()) as SupabaseResponse<ProjectSession>;

    if (response.error || !response.data) {
      throw new BadRequestException('세션 업데이트 실패');
    }

    return response.data.id;
  }

  static async createNewSession(
    supabaseService: SupabaseService,
    projectId: string,
    userId: string,
    userInfo: JoinProjectDto,
  ): Promise<string> {
    const supabase = supabaseService.getClient();
    const response = (await supabase
      .from(SUPABASE_TABLES.PROJECT_SESSIONS)
      .insert({
        project_id: projectId,
        user_id: userId,
        user_info: userInfo,
        is_active: true,
        joined_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
      })
      .select()
      .single()) as SupabaseResponse<ProjectSession>;

    if (response.error || !response.data) {
      throw new BadRequestException('세션 생성 실패');
    }

    return response.data.id;
  }
}
