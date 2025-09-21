// Supabase Database 테이블 타입 정의
export interface ProjectSession {
  id: string;
  project_id: string;
  user_id: string;
  user_info: {
    username: string;
    email?: string;
    avatar?: string;
  };
  cursor_position?: {
    x: number;
    y: number;
  };
  is_active: boolean;
  joined_at: string;
  last_activity: string;
  created_at?: string;
  updated_at?: string;
}

export interface Comment {
  id: string;
  project_id: string;
  user_id: string;
  username: string;
  content: string;
  position: {
    x: number;
    y: number;
  };
  parent_id?: string; // 답글을 위한 필드
  is_resolved: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  settings?: {
    allow_comments: boolean;
    allow_guests: boolean;
    max_participants?: number;
  };
  created_at: string;
  updated_at?: string;
}

// 마우스 좌표 및 경로 타입
export interface MousePosition {
  x: number;
  y: number;
  viewport_x?: number; // 뷰포트 상대 좌표
  viewport_y?: number;
  page_url?: string; // 현재 페이지 URL
  element_path?: string; // DOM 경로 (선택적)
}

export interface MousePath {
  id?: string;
  user_id: string;
  project_id: string;
  path_data: MousePosition[]; // 마우스 이동 경로 배열
  start_time: string;
  end_time?: string;
  is_active: boolean;
}

// Realtime 이벤트 타입 정의
export interface CursorMoveEvent {
  user_id: string;
  username: string;
  position: MousePosition;
  velocity?: { dx: number; dy: number }; // 마우스 속도
  timestamp: string;
  color?: string; // 사용자별 커서 색상
}

export interface MouseTrailEvent {
  user_id: string;
  username: string;
  trail: MousePosition[]; // 최근 N개의 위치
  timestamp: string;
}

export interface CommentEvent {
  action: 'created' | 'updated' | 'deleted' | 'resolved';
  comment: Comment;
  user_id: string;
  timestamp: string;
}

export interface PresenceState {
  user_id: string;
  username: string;
  online_at: string;
  cursor_position?: {
    x: number;
    y: number;
  };
  is_active: boolean;
}

// DTO 타입
export interface CreateCommentDto {
  content: string;
  position: {
    x: number;
    y: number;
  };
  parent_id?: string;
}

export interface UpdateCursorDto {
  position: MousePosition;
  velocity?: { dx: number; dy: number };
  color?: string;
}

export interface MouseTrailDto {
  trail: MousePosition[];
  batchSize?: number; // 한 번에 보낼 좌표 개수
}

export interface JoinProjectDto {
  username: string;
  email?: string;
  avatar?: string;
}

// Supabase 테이블 이름 상수
export const SUPABASE_TABLES = {
  PROJECTS: 'projects',
  PROJECT_SESSIONS: 'project_sessions',
  COMMENTS: 'comments',
} as const;

// Realtime 채널 이벤트 이름 상수
export const REALTIME_EVENTS = {
  CURSOR_MOVE: 'cursor-move',
  CURSOR_BATCH: 'cursor-batch', // 배치 업데이트
  MOUSE_TRAIL: 'mouse-trail', // 마우스 궤적
  MOUSE_CLICK: 'mouse-click', // 클릭 이벤트
  COMMENT_CREATED: 'comment-created',
  COMMENT_UPDATED: 'comment-updated',
  COMMENT_DELETED: 'comment-deleted',
  COMMENT_RESOLVED: 'comment-resolved',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  USER_IDLE: 'user-idle', // 유저 유휴 상태
  USER_ACTIVE: 'user-active', // 유저 활성 상태
} as const;
