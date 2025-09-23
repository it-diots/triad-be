import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { CollaborationService } from './collaboration.service';
import { UsersService } from '../users/users.service';

interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  username: string;
  color?: string;
}

interface Comment {
  id: string;
  userId: string;
  username: string;
  content: string;
  position: { x: number; y: number };
  timestamp: Date;
  url?: string;
  xpath?: string;
}

interface UserInfo {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

interface ExtensionSession {
  url: string;
  domain: string;
  path: string;
  users: Map<string, UserInfo>;
  cursors: Map<string, CursorPosition>;
  comments: Comment[];
}

@WebSocketGateway({
  cors: {
    origin: [
      'chrome-extension://*',
      'http://localhost:*',
      process.env.FRONTEND_URL || 'http://localhost:3001',
    ],
    credentials: true,
  },
  namespace: '/collaboration',
})
export class CollaborationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('CollaborationGateway');
  private urlSessions: Map<string, ExtensionSession> = new Map(); // URL 기반 세션
  private userSocketMap: Map<string, string> = new Map(); // userId -> socketId
  private socketUserMap: Map<string, UserInfo> = new Map(); // socketId -> user 정보
  private socketUrlMap: Map<string, string> = new Map(); // socketId -> current URL

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
    private collaborationService: CollaborationService,
  ) {}

  afterInit(_server: Server): void {
    this.logger.log('WebSocket Gateway initialized for Chrome Extension');
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.verifyToken(token);
      const user = await this.usersService.findOne(payload.sub);

      if (!user) {
        client.disconnect();
        return;
      }

      this.socketUserMap.set(client.id, user);
      this.userSocketMap.set(user.id, client.id);

      this.logger.log(`Extension connected: ${client.id} (User: ${user.username})`);

      client.emit('connected', {
        message: 'Successfully connected to collaboration server',
        userId: user.id,
        username: user.username,
      });
    } catch (error) {
      this.logger.error(
        `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const user = this.socketUserMap.get(client.id);
    const currentUrl = this.socketUrlMap.get(client.id);

    if (user) {
      this.userSocketMap.delete(user.id);
      this.socketUserMap.delete(client.id);

      // URL 세션에서 사용자 제거
      if (currentUrl) {
        const session = this.urlSessions.get(currentUrl);
        if (session) {
          session.users.delete(user.id);
          session.cursors.delete(user.id);

          // 같은 URL의 다른 사용자들에게 알림
          client.to(currentUrl).emit('user-left', {
            userId: user.id,
            username: user.username,
          });

          // 빈 세션 정리
          if (session.users.size === 0) {
            this.urlSessions.delete(currentUrl);
          }
        }
      }
    }

    this.socketUrlMap.delete(client.id);
    this.logger.log(`Extension disconnected: ${client.id}`);
  }

  @SubscribeMessage('page:join')
  async handlePageJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { url: string; title?: string },
  ): Promise<void> {
    const user = this.socketUserMap.get(client.id);
    if (!user) {
      throw new WsException('User not authenticated');
    }

    const { url } = data;

    // 이전 URL에서 나가기
    const previousUrl = this.socketUrlMap.get(client.id);
    if (previousUrl && previousUrl !== url) {
      await this.handlePageLeave(client, { url: previousUrl });
    }

    // URL 정규화
    const normalizedUrl = this.normalizeUrl(url);
    const session = this.getOrCreateUrlSession(normalizedUrl);

    // Socket.io 룸 참가
    await client.join(normalizedUrl);
    this.socketUrlMap.set(client.id, normalizedUrl);

    // 세션에 사용자 추가
    session.users.set(user.id, user);

    // CollaborationService를 통해 세션 관리
    await this.collaborationService.joinUrlProject(normalizedUrl, user.id, {
      username: user.username,
      userEmail: user.email,
      userAvatar: user.avatar,
    });

    // 현재 상태 전송
    this.sendSessionState(client, session, normalizedUrl);

    // 다른 사용자들에게 알림
    client.to(normalizedUrl).emit('user-joined', {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
    });

    this.logger.log(`User ${user.username} joined page ${normalizedUrl}`);
  }

  @SubscribeMessage('page:leave')
  async handlePageLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { url: string },
  ): Promise<void> {
    const user = this.socketUserMap.get(client.id);
    if (!user) {
      return;
    }

    const normalizedUrl = this.normalizeUrl(data.url);
    const session = this.urlSessions.get(normalizedUrl);

    if (session) {
      session.users.delete(user.id);
      session.cursors.delete(user.id);

      await client.leave(normalizedUrl);
      this.socketUrlMap.delete(client.id);

      // 다른 사용자들에게 알림
      client.to(normalizedUrl).emit('user-left', {
        userId: user.id,
        username: user.username,
      });

      // CollaborationService를 통해 세션 종료
      await this.collaborationService.leaveProject(normalizedUrl, user.id);

      // 빈 세션 정리
      if (session.users.size === 0) {
        this.urlSessions.delete(normalizedUrl);
      }
    }

    this.logger.log(`User ${user.username} left page ${normalizedUrl}`);
  }

  @SubscribeMessage('cursor:move')
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { url: string; x: number; y: number; color?: string },
  ): void {
    const user = this.socketUserMap.get(client.id);
    if (!user) {
      return;
    }

    const normalizedUrl = this.normalizeUrl(data.url);
    const session = this.urlSessions.get(normalizedUrl);

    if (session && session.users.has(user.id)) {
      const cursorData: CursorPosition = {
        userId: user.id,
        username: user.username,
        x: data.x,
        y: data.y,
        color: data.color || this.generateColor(user.id),
      };

      session.cursors.set(user.id, cursorData);

      // 같은 페이지의 다른 사용자들에게 브로드캐스트
      client.to(normalizedUrl).emit('cursor:update', cursorData);

      // CollaborationService로 전파
      void this.collaborationService.updateCursorPosition(normalizedUrl, user.id, user.username, {
        position: { x: data.x, y: data.y },
        color: cursorData.color,
      });
    }
  }

  @SubscribeMessage('cursor:click')
  handleCursorClick(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { url: string; x: number; y: number; clickType?: 'left' | 'right' },
  ): void {
    const user = this.socketUserMap.get(client.id);
    if (!user) {
      return;
    }

    const normalizedUrl = this.normalizeUrl(data.url);

    // 같은 페이지의 다른 사용자들에게 클릭 이벤트 브로드캐스트
    client.to(normalizedUrl).emit('cursor:clicked', {
      userId: user.id,
      username: user.username,
      x: data.x,
      y: data.y,
      clickType: data.clickType || 'left',
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('comment:create')
  async handleCommentCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      url: string;
      content: string;
      position: { x: number; y: number };
      xpath?: string;
    },
  ): Promise<void> {
    const user = this.socketUserMap.get(client.id);
    if (!user) {
      return;
    }

    const normalizedUrl = this.normalizeUrl(data.url);
    const session = this.urlSessions.get(normalizedUrl);

    if (session && session.users.has(user.id)) {
      // CollaborationService를 통해 코멘트 생성
      const comment = await this.collaborationService.createComment(
        normalizedUrl,
        user.id,
        user.username,
        {
          content: data.content,
          position: data.position,
        },
      );

      // 세션에 코멘트 추가
      const extendedComment = {
        ...comment,
        url: normalizedUrl,
        xpath: data.xpath,
        timestamp: new Date(),
      };
      session.comments.push(extendedComment);

      // 모든 사용자에게 브로드캐스트
      this.server.to(normalizedUrl).emit('comment:created', extendedComment);

      this.logger.log(`Comment created by ${user.username} on ${normalizedUrl}`);
    }
  }

  @SubscribeMessage('comment:delete')
  async handleCommentDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { url: string; commentId: string },
  ): Promise<void> {
    const user = this.socketUserMap.get(client.id);
    if (!user) {
      return;
    }

    const normalizedUrl = this.normalizeUrl(data.url);
    const session = this.urlSessions.get(normalizedUrl);

    if (session) {
      const commentIndex = session.comments.findIndex((c) => c.id === data.commentId);

      if (commentIndex !== -1) {
        const comment = session.comments[commentIndex];

        // 권한 확인 (작성자 또는 관리자만 삭제 가능)
        if (comment.userId === user.id || user.role === 'ADMIN') {
          // CollaborationService를 통해 삭제
          await this.collaborationService.deleteComment(normalizedUrl, data.commentId, user.id);

          session.comments.splice(commentIndex, 1);

          // 모든 사용자에게 브로드캐스트
          this.server.to(normalizedUrl).emit('comment:deleted', {
            commentId: data.commentId,
          });

          this.logger.log(`Comment ${data.commentId} deleted by ${user.username}`);
        }
      }
    }
  }

  @SubscribeMessage('selection:share')
  handleSelectionShare(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      url: string;
      text: string;
      startXPath?: string;
      endXPath?: string;
      bounds?: { top: number; left: number; width: number; height: number };
    },
  ): void {
    const user = this.socketUserMap.get(client.id);
    if (!user) {
      return;
    }

    const normalizedUrl = this.normalizeUrl(data.url);

    // 같은 페이지의 다른 사용자들에게 선택 영역 공유
    client.to(normalizedUrl).emit('selection:updated', {
      userId: user.id,
      username: user.username,
      text: data.text,
      startXPath: data.startXPath,
      endXPath: data.endXPath,
      bounds: data.bounds,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('scroll:sync')
  handleScrollSync(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { url: string; scrollTop: number; scrollLeft: number },
  ): void {
    const user = this.socketUserMap.get(client.id);
    if (!user) {
      return;
    }

    const normalizedUrl = this.normalizeUrl(data.url);

    // 스크롤 동기화 (선택적 기능)
    client.to(normalizedUrl).emit('scroll:updated', {
      userId: user.id,
      username: user.username,
      scrollTop: data.scrollTop,
      scrollLeft: data.scrollLeft,
    });
  }

  // EventEmitter 이벤트 리스너들
  @OnEvent('cursor.move')
  handleCursorMoveEvent(payload: Record<string, unknown>): void {
    const projectId = payload.projectId as string;
    this.server.to(projectId).emit('cursor:update', payload);
  }

  @OnEvent('comment.created')
  handleCommentCreatedEvent(payload: Record<string, unknown>): void {
    const projectId = payload.projectId as string;
    this.server.to(projectId).emit('comment:created', payload);
  }

  @OnEvent('comment.deleted')
  handleCommentDeletedEvent(payload: Record<string, unknown>): void {
    const projectId = payload.projectId as string;
    this.server.to(projectId).emit('comment:deleted', payload);
  }

  @OnEvent('user.active')
  handleUserActiveEvent(payload: Record<string, unknown>): void {
    const projectId = payload.projectId as string;
    this.server.to(projectId).emit('user:active', payload);
  }

  @OnEvent('user.idle')
  handleUserIdleEvent(payload: Record<string, unknown>): void {
    const projectId = payload.projectId as string;
    this.server.to(projectId).emit('user:idle', payload);
  }

  // Helper methods
  private getOrCreateUrlSession(url: string): ExtensionSession {
    if (!this.urlSessions.has(url)) {
      const urlObj = new URL(url);
      this.urlSessions.set(url, {
        url,
        domain: urlObj.hostname,
        path: urlObj.pathname,
        users: new Map(),
        cursors: new Map(),
        comments: [],
      });
    }

    const session = this.urlSessions.get(url);
    if (!session) {
      throw new WsException('Failed to create or get URL session');
    }
    return session;
  }

  private sendSessionState(client: Socket, session: ExtensionSession, url: string): void {
    client.emit('page:joined', {
      url,
      users: Array.from(session.users.values()).map((u) => ({
        id: u.id,
        username: u.username,
        avatar: u.avatar,
      })),
      cursors: Array.from(session.cursors.values()),
      comments: session.comments,
    });
  }

  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // 쿼리 파라미터와 해시 제거하여 정규화
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch {
      return url;
    }
  }

  private generateColor(userId: string): string {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFA07A',
      '#20B2AA',
      '#9370DB',
      '#FFD700',
      '#FF69B4',
      '#00CED1',
      '#FF8C00',
      '#7B68EE',
    ];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  }

  private extractTokenFromSocket(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Query params에서도 토큰 확인
    const token = client.handshake.query.token as string;
    return token || null;
  }

  private async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });
    } catch {
      throw new WsException('Invalid token');
    }
  }
}
