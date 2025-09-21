import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

interface ProjectRoom {
  projectId: string;
  users: Map<string, UserInfo>;
  cursors: Map<string, CursorPosition>;
  comments: Comment[];
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
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
  private projectRooms: Map<string, ProjectRoom> = new Map();
  private userSocketMap: Map<string, string> = new Map(); // userId -> socketId
  private socketUserMap: Map<string, UserInfo> = new Map(); // socketId -> user 정보

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  afterInit(_server: Server): void {
    this.logger.log('WebSocket Gateway initialized');
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

      this.logger.log(`Client connected: ${client.id} (User: ${user.username})`);

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

    if (user) {
      this.userSocketMap.delete(user.id);
      this.socketUserMap.delete(client.id);

      // Remove user from all project rooms
      this.projectRooms.forEach((room, projectId) => {
        if (room.users.has(user.id)) {
          room.users.delete(user.id);
          room.cursors.delete(user.id);

          // Notify other users in the room
          client.to(projectId).emit('user-left', {
            userId: user.id,
            username: user.username,
          });
        }
      });
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-project')
  async handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ): Promise<void> {
    const user = this.socketUserMap.get(client.id);
    if (!user) {
      throw new WsException('User not authenticated');
    }

    const { projectId } = data;

    // Initialize or get the project room
    const room = this.getOrCreateProjectRoom(projectId);

    // Join the socket room
    await client.join(projectId);

    // Add user to the room
    room.users.set(user.id, user);

    // Send current room state to the joining user
    this.sendRoomState(client, room, projectId);

    // Notify other users in the room
    this.notifyUserJoined(client, projectId, user);

    this.logger.log(`User ${user.username} joined project ${projectId}`);
  }

  @SubscribeMessage('leave-project')
  async handleLeaveProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ): Promise<void> {
    const user = this.socketUserMap.get(client.id);
    if (!user) {
      throw new WsException('User not authenticated');
    }

    const { projectId } = data;
    const room = this.projectRooms.get(projectId);

    if (room) {
      room.users.delete(user.id);
      room.cursors.delete(user.id);

      await client.leave(projectId);

      // Notify other users
      client.to(projectId).emit('user-left', {
        userId: user.id,
        username: user.username,
      });

      // Clean up empty rooms
      if (room.users.size === 0) {
        this.projectRooms.delete(projectId);
      }
    }

    this.logger.log(`User ${user.username} left project ${projectId}`);
  }

  @SubscribeMessage('cursor-move')
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string; x: number; y: number; color?: string },
  ): void {
    const user = this.socketUserMap.get(client.id);
    if (!user) {
      return;
    }

    const { projectId, x, y, color } = data;
    const room = this.projectRooms.get(projectId);

    if (room && room.users.has(user.id)) {
      const cursorData: CursorPosition = {
        userId: user.id,
        username: user.username,
        x,
        y,
        color: color || '#' + Math.floor(Math.random() * 16777215).toString(16),
      };

      room.cursors.set(user.id, cursorData);

      // Broadcast to other users in the room
      client.to(projectId).emit('cursor-update', cursorData);
    }
  }

  @SubscribeMessage('comment-create')
  handleCommentCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      projectId: string;
      content: string;
      position: { x: number; y: number };
    },
  ): void {
    const user = this.socketUserMap.get(client.id);
    if (!user) {
      return;
    }

    const { projectId, content, position } = data;
    const room = this.projectRooms.get(projectId);

    if (room && room.users.has(user.id)) {
      const comment: Comment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        username: user.username,
        content,
        position,
        timestamp: new Date(),
      };

      room.comments.push(comment);

      // Broadcast to all users in the room (including sender)
      this.server.to(projectId).emit('comment-created', comment);

      this.logger.log(`Comment created by ${user.username} in project ${projectId}`);
    }
  }

  @SubscribeMessage('comment-delete')
  handleCommentDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string; commentId: string },
  ): void {
    const user = this.socketUserMap.get(client.id);
    if (!user) {
      return;
    }

    const { projectId, commentId } = data;
    const room = this.projectRooms.get(projectId);

    if (room) {
      const commentIndex = room.comments.findIndex((c) => c.id === commentId);

      if (commentIndex !== -1) {
        const comment = room.comments[commentIndex];

        // Only allow deletion by comment owner or admin
        if (comment.userId === user.id || user.role === 'ADMIN') {
          room.comments.splice(commentIndex, 1);

          // Broadcast to all users in the room
          this.server.to(projectId).emit('comment-deleted', { commentId });

          this.logger.log(`Comment ${commentId} deleted by ${user.username}`);
        }
      }
    }
  }

  @SubscribeMessage('broadcast-message')
  handleBroadcastMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string; type: string; payload: Record<string, unknown> },
  ): void {
    const user = this.socketUserMap.get(client.id);
    if (!user) {
      return;
    }

    const { projectId, type, payload } = data;
    const room = this.projectRooms.get(projectId);

    if (room && room.users.has(user.id)) {
      // Broadcast custom message to other users in the room
      client.to(projectId).emit('custom-message', {
        type,
        payload,
        userId: user.id,
        username: user.username,
        timestamp: new Date(),
      });
    }
  }

  private getOrCreateProjectRoom(projectId: string): ProjectRoom {
    if (!this.projectRooms.has(projectId)) {
      this.projectRooms.set(projectId, {
        projectId,
        users: new Map(),
        cursors: new Map(),
        comments: [],
      });
    }

    const room = this.projectRooms.get(projectId);
    if (!room) {
      throw new WsException('Failed to create or get project room');
    }
    return room;
  }

  private sendRoomState(client: Socket, room: ProjectRoom, projectId: string): void {
    client.emit('project-joined', {
      projectId,
      users: Array.from(room.users.values()).map((u) => ({
        id: u.id,
        username: u.username,
        avatar: u.avatar,
      })),
      cursors: Array.from(room.cursors.values()),
      comments: room.comments,
    });
  }

  private notifyUserJoined(client: Socket, projectId: string, user: UserInfo): void {
    client.to(projectId).emit('user-joined', {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
    });
  }

  private extractTokenFromSocket(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Also check query params for token
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
