import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { UsersService } from '../users/users.service';

import { CollaborationService } from './collaboration.service';

import type {
  CommentCreateMessage,
  CursorMoveMessage,
  CursorPosition,
  ExtensionSession,
  JwtPayload,
  ProjectCommentPayload,
  SessionComment,
  UserInfo,
} from './collaboration.gateway.types';

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
  private socketProjectMap: Map<string, string> = new Map(); // socketId -> projectId
  private urlProjectMap: Map<string, string> = new Map(); // URL -> projectId
  private projectIdUrlMap: Map<string, string> = new Map(); // projectId -> URL

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

  async handleDisconnect(client: Socket): Promise<void> {
    const user = this.socketUserMap.get(client.id);
    const currentUrl = this.socketUrlMap.get(client.id);
    const projectId = this.socketProjectMap.get(client.id);

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
            this.cleanupEmptySession(session, currentUrl);
          }
        }
      }

      if (projectId) {
        await this.collaborationService.leaveProject(projectId, user.id);
      }
    }

    this.socketUrlMap.delete(client.id);
    this.socketProjectMap.delete(client.id);
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

    const normalizedUrl = this.normalizeUrl(data.url);

    await this.leaveIfJoiningAnotherPage(client, normalizedUrl);

    const session = this.getOrCreateUrlSession(normalizedUrl);
    await this.joinSessionAndSetProject(client, session, normalizedUrl, user);

    await this.loadSessionComments(session, normalizedUrl);

    this.sendSessionState(client, session, normalizedUrl);
    this.notifyPageJoin(client, normalizedUrl, user);

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
    const projectId = session?.projectId ?? this.socketProjectMap.get(client.id);

    if (session) {
      session.users.delete(user.id);
      session.cursors.delete(user.id);

      await client.leave(normalizedUrl);

      // 다른 사용자들에게 알림
      client.to(normalizedUrl).emit('user-left', {
        userId: user.id,
        username: user.username,
      });

      // CollaborationService를 통해 세션 종료
      if (projectId) {
        await this.collaborationService.leaveProject(projectId, user.id);
      }

      // 빈 세션 정리
      if (session.users.size === 0) {
        this.cleanupEmptySession(session, normalizedUrl);
      }
    } else {
      await client.leave(normalizedUrl);
    }

    if (!session && projectId) {
      await this.collaborationService.leaveProject(projectId, user.id);
    }

    this.socketUrlMap.delete(client.id);
    this.socketProjectMap.delete(client.id);

    this.logger.log(`User ${user.username} left page ${normalizedUrl}`);
  }

  @SubscribeMessage('cursor:move')
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CursorMoveMessage,
  ): void {
    const user = this.socketUserMap.get(client.id);
    if (!user) {
      return;
    }

    const normalizedUrl = this.normalizeUrl(data.url);
    const session = this.urlSessions.get(normalizedUrl);

    if (!session || !session.users.has(user.id)) {
      return;
    }

    const projectId = session.projectId ?? this.socketProjectMap.get(client.id);
    const cursorData = this.buildCursorData(user, data);

    session.cursors.set(user.id, cursorData);
    this.broadcastCursorMove(client, normalizedUrl, cursorData);

    if (projectId) {
      this.persistCursorPosition(projectId, user, data, cursorData.color);
    } else {
      this.logger.warn(`Missing projectId for cursor move on ${normalizedUrl}`);
    }
  }

  @SubscribeMessage('cursor:click')
  handleCursorClick(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      url: string;
      x: number;
      y: number;
      clickType?: 'left' | 'right' | 'double';
      targetElement?: string; // clicked element selector
      targetText?: string; // clicked element text content
    },
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
      targetElement: data.targetElement,
      targetText: data.targetText,
      color: this.generateColor(user.id),
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('comment:create')
  async handleCommentCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CommentCreateMessage,
  ): Promise<void> {
    const user = this.socketUserMap.get(client.id);
    if (!user) {
      return;
    }

    const normalizedUrl = this.normalizeUrl(data.url);
    const session = this.urlSessions.get(normalizedUrl);
    if (!session || !session.users.has(user.id)) {
      return;
    }

    const projectId = session.projectId ?? this.socketProjectMap.get(client.id);
    if (!projectId) {
      this.logger.warn(`Missing projectId for comment creation on ${normalizedUrl}`);
      return;
    }

    const sessionComment = await this.createSessionComment({
      session,
      normalizedUrl,
      projectId,
      user,
      data,
    });

    this.server.to(normalizedUrl).emit('comment:created', sessionComment);

    this.logger.log(`Comment created by ${user.username} on ${normalizedUrl}`);
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
    const projectId = session?.projectId ?? this.socketProjectMap.get(client.id);

    if (!projectId) {
      this.logger.warn(`Missing projectId for comment deletion on ${normalizedUrl}`);
      return;
    }

    if (session) {
      const commentIndex = session.comments.findIndex((c) => c.id === data.commentId);

      if (commentIndex !== -1) {
        const comment = session.comments[commentIndex];

        // 권한 확인 (작성자 또는 관리자만 삭제 가능)
        if (comment.userId === user.id || user.role === 'ADMIN') {
          // CollaborationService를 통해 삭제
          await this.collaborationService.deleteComment(projectId, data.commentId, user.id);

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
      color?: string;
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
      color: data.color || this.generateColor(user.id),
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('scroll:sync')
  handleScrollSync(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      url: string;
      scrollTop: number;
      scrollLeft: number;
      viewportHeight?: number;
      viewportWidth?: number;
      pageHeight?: number;
      pageWidth?: number;
    },
  ): void {
    const user = this.socketUserMap.get(client.id);
    if (!user) {
      return;
    }

    const normalizedUrl = this.normalizeUrl(data.url);

    // 스크롤 동기화 (선택적 기능)
    // 뷰포트 크기 정보를 함께 전송하여 상대적 위치 계산 가능
    client.to(normalizedUrl).emit('scroll:updated', {
      userId: user.id,
      username: user.username,
      scrollTop: data.scrollTop,
      scrollLeft: data.scrollLeft,
      viewportHeight: data.viewportHeight,
      viewportWidth: data.viewportWidth,
      pageHeight: data.pageHeight,
      pageWidth: data.pageWidth,
      scrollPercentX: data.pageWidth ? (data.scrollLeft / data.pageWidth) * 100 : 0,
      scrollPercentY: data.pageHeight ? (data.scrollTop / data.pageHeight) * 100 : 0,
    });
  }

  // EventEmitter 이벤트 리스너들
  @OnEvent('cursor.move')
  handleCursorMoveEvent(payload: Record<string, unknown>): void {
    const projectId = payload.projectId as string;
    this.emitToProjectRooms(projectId, 'cursor:update', payload);
  }

  @OnEvent('comment.created')
  handleCommentCreatedEvent(payload: Record<string, unknown>): void {
    const projectId = payload.projectId as string;
    const urlRoom = this.projectIdUrlMap.get(projectId);
    if (urlRoom) {
      const session = this.urlSessions.get(urlRoom);
      const comment = payload.comment as SessionComment | undefined;
      if (session && comment) {
        const exists = session.comments.some((c) => c.id === comment.id);
        if (!exists) {
          session.comments.push({
            id: comment.id,
            userId: comment.userId,
            username: comment.username,
            content: comment.content,
            position: comment.position,
            timestamp:
              payload.timestamp instanceof Date
                ? payload.timestamp
                : new Date((payload.timestamp as string) ?? Date.now()),
            url: urlRoom,
          });
        }
      }
    }

    this.emitToProjectRooms(projectId, 'comment:created', payload);
  }

  @OnEvent('comment.deleted')
  handleCommentDeletedEvent(payload: Record<string, unknown>): void {
    const projectId = payload.projectId as string;
    const urlRoom = this.projectIdUrlMap.get(projectId);
    const commentId = payload.commentId as string | undefined;

    if (urlRoom && commentId) {
      const session = this.urlSessions.get(urlRoom);
      if (session) {
        const index = session.comments.findIndex((c) => c.id === commentId);
        if (index !== -1) {
          session.comments.splice(index, 1);
        }
      }
    }

    this.emitToProjectRooms(projectId, 'comment:deleted', payload);
  }

  @OnEvent('user.active')
  handleUserActiveEvent(payload: Record<string, unknown>): void {
    const projectId = payload.projectId as string;
    this.emitToProjectRooms(projectId, 'user:active', payload);
  }

  @OnEvent('user.idle')
  handleUserIdleEvent(payload: Record<string, unknown>): void {
    const projectId = payload.projectId as string;
    this.emitToProjectRooms(projectId, 'user:idle', payload);
  }

  // Helper methods
  private async leaveIfJoiningAnotherPage(client: Socket, normalizedUrl: string): Promise<void> {
    const previousUrl = this.socketUrlMap.get(client.id);
    if (previousUrl && previousUrl !== normalizedUrl) {
      await this.handlePageLeave(client, { url: previousUrl });
    }
  }

  private async joinSessionAndSetProject(
    client: Socket,
    session: ExtensionSession,
    normalizedUrl: string,
    user: UserInfo,
  ): Promise<void> {
    await client.join(normalizedUrl);
    this.socketUrlMap.set(client.id, normalizedUrl);

    session.users.set(user.id, user);

    const joinResult = await this.collaborationService.joinUrlProject(normalizedUrl, user.id, {
      username: user.username,
      userEmail: user.email,
      userAvatar: user.avatar,
    });

    if (!joinResult.projectId) {
      this.logger.warn(`Failed to resolve projectId for URL ${normalizedUrl}`);
      return;
    }

    if (session.projectId && session.projectId !== joinResult.projectId) {
      this.logger.warn(
        `ProjectId mismatch for URL ${normalizedUrl}: existing ${session.projectId}, new ${joinResult.projectId}`,
      );
    }

    session.projectId = joinResult.projectId;
    this.socketProjectMap.set(client.id, session.projectId);
    this.urlProjectMap.set(normalizedUrl, session.projectId);
    this.projectIdUrlMap.set(session.projectId, normalizedUrl);
  }

  private async loadSessionComments(
    session: ExtensionSession,
    normalizedUrl: string,
  ): Promise<void> {
    if (session.comments.length > 0 || !session.projectId) {
      return;
    }

    try {
      const comments = await this.collaborationService.getProjectComments(session.projectId);
      session.comments = comments.map((comment) =>
        this.mapProjectCommentToSessionComment(comment, normalizedUrl),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to load comments for ${normalizedUrl}: ${message}`);
    }
  }

  private notifyPageJoin(client: Socket, normalizedUrl: string, user: UserInfo): void {
    client.to(normalizedUrl).emit('user-joined', {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
    });
  }

  private buildCursorData(user: UserInfo, data: CursorMoveMessage): CursorPosition {
    const color = data.color || this.generateColor(user.id);

    return {
      userId: user.id,
      username: user.username,
      x: data.x,
      y: data.y,
      absoluteX: data.scrollX ? data.x + data.scrollX : data.x,
      absoluteY: data.scrollY ? data.y + data.scrollY : data.y,
      elementX: data.elementX,
      elementY: data.elementY,
      viewport: data.viewport,
      color,
      timestamp: Date.now(),
    };
  }

  private broadcastCursorMove(
    client: Socket,
    normalizedUrl: string,
    cursorData: CursorPosition,
  ): void {
    client.to(normalizedUrl).emit('cursor:update', cursorData);
  }

  private persistCursorPosition(
    projectId: string,
    user: UserInfo,
    data: CursorMoveMessage,
    color?: string,
  ): void {
    void this.collaborationService.updateCursorPosition(projectId, user.id, user.username, {
      position: { x: data.x, y: data.y },
      color,
    });
  }

  private async createSessionComment({
    session,
    normalizedUrl,
    projectId,
    user,
    data,
  }: {
    session: ExtensionSession;
    normalizedUrl: string;
    projectId: string;
    user: UserInfo;
    data: CommentCreateMessage;
  }): Promise<SessionComment> {
    const comment = await this.collaborationService.createComment(
      projectId,
      user.id,
      user.username,
      {
        content: data.content,
        position: data.position,
      },
    );

    const sessionComment: SessionComment = {
      id: comment.id,
      userId: comment.userId ?? comment.user_id,
      username: comment.username,
      content: comment.content,
      position: comment.position,
      timestamp: new Date(),
      url: normalizedUrl,
      xpath: data.xpath,
    };

    session.comments.push(sessionComment);
    return sessionComment;
  }

  private mapProjectCommentToSessionComment(
    comment: ProjectCommentPayload,
    normalizedUrl: string,
  ): SessionComment {
    return {
      id: comment.id,
      userId: comment.userId ?? comment.user_id ?? '',
      username: comment.username,
      content: comment.content,
      position: comment.position,
      timestamp: comment.created_at ? new Date(comment.created_at) : new Date(),
      url: normalizedUrl,
    };
  }

  private cleanupEmptySession(session: ExtensionSession, url: string): void {
    if (session.projectId) {
      this.projectIdUrlMap.delete(session.projectId);
    }
    this.urlProjectMap.delete(url);
    this.urlSessions.delete(url);
  }

  private emitToProjectRooms(projectId: string, event: string, payload: unknown): void {
    if (projectId) {
      this.server.to(projectId).emit(event, payload);
    }

    const urlRoom = this.projectIdUrlMap.get(projectId);
    if (urlRoom && urlRoom !== projectId) {
      this.server.to(urlRoom).emit(event, payload);
    }
  }

  private getOrCreateUrlSession(url: string): ExtensionSession {
    if (!this.urlSessions.has(url)) {
      const urlObj = new URL(url);
      this.urlSessions.set(url, {
        url,
        domain: urlObj.hostname,
        path: urlObj.pathname,
        projectId: this.urlProjectMap.get(url),
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
