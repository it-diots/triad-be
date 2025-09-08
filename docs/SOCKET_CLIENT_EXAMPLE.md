# Socket.io 클라이언트 연결 예제

## 설치

```bash
npm install socket.io-client
```

## 연결 예제

```typescript
import { io, Socket } from 'socket.io-client';

class CollaborationClient {
  private socket: Socket;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.initializeSocket();
  }

  private initializeSocket(): void {
    this.socket = io('http://localhost:3000/collaboration', {
      auth: {
        token: this.accessToken,
      },
      extraHeaders: {
        Authorization: `Bearer ${this.accessToken}`,
      },
      transports: ['websocket'],
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // 연결 성공
    this.socket.on('connected', (data) => {
      console.log('Connected to collaboration server:', data);
    });

    // 프로젝트 참여 성공
    this.socket.on('project-joined', (data) => {
      console.log('Joined project:', data);
    });

    // 다른 사용자 참여
    this.socket.on('user-joined', (data) => {
      console.log('User joined:', data);
    });

    // 다른 사용자 나감
    this.socket.on('user-left', (data) => {
      console.log('User left:', data);
    });

    // 커서 업데이트
    this.socket.on('cursor-update', (data) => {
      console.log('Cursor update:', data);
    });

    // 코멘트 생성
    this.socket.on('comment-created', (data) => {
      console.log('Comment created:', data);
    });

    // 코멘트 삭제
    this.socket.on('comment-deleted', (data) => {
      console.log('Comment deleted:', data);
    });

    // 커스텀 메시지
    this.socket.on('custom-message', (data) => {
      console.log('Custom message:', data);
    });

    // 연결 끊김
    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
    });

    // 에러
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  // 프로젝트 참여
  joinProject(projectId: string): void {
    this.socket.emit('join-project', { projectId });
  }

  // 프로젝트 나가기
  leaveProject(projectId: string): void {
    this.socket.emit('leave-project', { projectId });
  }

  // 커서 이동
  moveCursor(projectId: string, x: number, y: number, color?: string): void {
    this.socket.emit('cursor-move', { projectId, x, y, color });
  }

  // 코멘트 생성
  createComment(projectId: string, content: string, position: { x: number; y: number }): void {
    this.socket.emit('comment-create', { projectId, content, position });
  }

  // 코멘트 삭제
  deleteComment(projectId: string, commentId: string): void {
    this.socket.emit('comment-delete', { projectId, commentId });
  }

  // 커스텀 메시지 브로드캐스트
  broadcastMessage(projectId: string, type: string, payload: any): void {
    this.socket.emit('broadcast-message', { projectId, type, payload });
  }

  // 연결 해제
  disconnect(): void {
    this.socket.disconnect();
  }
}

// 사용 예제
const accessToken = 'your-jwt-access-token';
const client = new CollaborationClient(accessToken);

// 프로젝트 참여
client.joinProject('project-123');

// 커서 이동
client.moveCursor('project-123', 100, 200, '#FF5733');

// 코멘트 생성
client.createComment('project-123', 'This looks good!', { x: 150, y: 250 });
```

## React Hook 예제

```tsx
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseCollaborationOptions {
  projectId: string;
  accessToken: string;
}

export const useCollaboration = ({ projectId, accessToken }: UseCollaborationOptions) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [cursors, setCursors] = useState<Map<string, any>>(new Map());
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    const newSocket = io('http://localhost:3000/collaboration', {
      auth: { token: accessToken },
      extraHeaders: { Authorization: `Bearer ${accessToken}` },
    });

    newSocket.on('connected', () => {
      setConnected(true);
      newSocket.emit('join-project', { projectId });
    });

    newSocket.on('project-joined', (data) => {
      setUsers(data.users);
      setCursors(new Map(data.cursors.map((c: any) => [c.userId, c])));
      setComments(data.comments);
    });

    newSocket.on('user-joined', (user) => {
      setUsers(prev => [...prev, user]);
    });

    newSocket.on('user-left', (data) => {
      setUsers(prev => prev.filter(u => u.id !== data.userId));
      setCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.delete(data.userId);
        return newCursors;
      });
    });

    newSocket.on('cursor-update', (cursor) => {
      setCursors(prev => new Map(prev).set(cursor.userId, cursor));
    });

    newSocket.on('comment-created', (comment) => {
      setComments(prev => [...prev, comment]);
    });

    newSocket.on('comment-deleted', ({ commentId }) => {
      setComments(prev => prev.filter(c => c.id !== commentId));
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave-project', { projectId });
      newSocket.disconnect();
    };
  }, [projectId, accessToken]);

  const moveCursor = useCallback((x: number, y: number) => {
    socket?.emit('cursor-move', { projectId, x, y });
  }, [socket, projectId]);

  const createComment = useCallback((content: string, position: { x: number; y: number }) => {
    socket?.emit('comment-create', { projectId, content, position });
  }, [socket, projectId]);

  const deleteComment = useCallback((commentId: string) => {
    socket?.emit('comment-delete', { projectId, commentId });
  }, [socket, projectId]);

  return {
    connected,
    users,
    cursors: Array.from(cursors.values()),
    comments,
    moveCursor,
    createComment,
    deleteComment,
  };
};
```

## 이벤트 목록

### 클라이언트 → 서버

- `join-project`: 프로젝트 참여
- `leave-project`: 프로젝트 나가기
- `cursor-move`: 커서 이동
- `comment-create`: 코멘트 생성
- `comment-delete`: 코멘트 삭제
- `broadcast-message`: 커스텀 메시지 브로드캐스트

### 서버 → 클라이언트

- `connected`: 연결 성공
- `project-joined`: 프로젝트 참여 완료
- `user-joined`: 다른 사용자 참여
- `user-left`: 다른 사용자 나감
- `cursor-update`: 커서 위치 업데이트
- `comment-created`: 코멘트 생성됨
- `comment-deleted`: 코멘트 삭제됨
- `custom-message`: 커스텀 메시지 수신