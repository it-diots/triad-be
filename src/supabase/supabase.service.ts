import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

import type { SupabaseConfig } from '../config/supabase.config';
import type { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabaseClient!: SupabaseClient<any, 'public', any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabaseAdmin!: SupabaseClient<any, 'public', any>;
  private channels: Map<string, RealtimeChannel> = new Map();

  constructor(private configService: ConfigService) {}

  onModuleInit(): void {
    const config = this.configService.get<SupabaseConfig>('supabase');

    if (!config?.url || !config?.anonKey) {
      this.logger.warn('Supabase configuration not found. Realtime features will be disabled.');
      return;
    }

    // Public client (anon key 사용)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.supabaseClient = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    // Admin client (service role key 사용)
    if (config.serviceRoleKey) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.supabaseAdmin = createClient(config.url, config.serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }

    this.logger.log('Supabase client initialized successfully');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getClient(): SupabaseClient<any, 'public', any> {
    return this.supabaseClient;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAdminClient(): SupabaseClient<any, 'public', any> {
    return this.supabaseAdmin || this.supabaseClient;
  }

  // Realtime 채널 생성 및 관리
  createChannel(channelName: string): RealtimeChannel {
    const existingChannel = this.channels.get(channelName);
    if (existingChannel) {
      return existingChannel;
    }

    const channel = this.supabaseClient.channel(channelName);
    this.channels.set(channelName, channel);
    return channel;
  }

  // 프로젝트별 실시간 협업 채널
  getProjectChannel(projectId: string): RealtimeChannel {
    const channelName = `project:${projectId}`;
    return this.createChannel(channelName);
  }

  // Presence 기능을 활용한 온라인 사용자 추적
  async trackPresence(
    channel: RealtimeChannel,
    userId: string,
    userInfo: Record<string, unknown>,
  ): Promise<void> {
    await channel.track({
      user_id: userId,
      online_at: new Date().toISOString(),
      ...userInfo,
    });
  }

  // 브로드캐스트 이벤트 전송
  async broadcastEvent(
    channel: RealtimeChannel,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  }

  // 커서 이동 이벤트 전송
  async broadcastCursorMove(
    projectId: string,
    userId: string,
    position: { x: number; y: number },
  ): Promise<void> {
    const channel = this.getProjectChannel(projectId);
    await this.broadcastEvent(channel, 'cursor-move', {
      userId,
      position,
      timestamp: new Date().toISOString(),
    });
  }

  // 코멘트 생성 이벤트 전송
  async broadcastCommentCreate(projectId: string, comment: Record<string, unknown>): Promise<void> {
    const channel = this.getProjectChannel(projectId);
    await this.broadcastEvent(channel, 'comment-created', {
      comment,
      timestamp: new Date().toISOString(),
    });
  }

  // 채널 구독 해제
  async unsubscribeChannel(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (channel) {
      await this.supabaseClient.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  // 모든 채널 정리
  async cleanup(): Promise<void> {
    for (const channel of this.channels.values()) {
      await this.supabaseClient.removeChannel(channel);
    }
    this.channels.clear();
  }
}
