/**
 * 프로젝트 세션 인터페이스
 * 프로젝트에 참여한 사용자의 세션 정보를 관리
 */
export interface ProjectSession {
  /** 세션 고유 식별자 */
  id: string;
  /** 프로젝트 ID */
  projectId: string;
  /** 사용자 ID */
  userId: string;
  /** 사용자명 */
  username: string;
  /** 사용자 이메일 */
  userEmail?: string;
  /** 사용자 프로필 이미지 URL */
  userAvatar?: string;
  /** 세션 참가 시간 */
  joinedAt: Date;
  /** 마지막 활동 시간 */
  lastActivity: Date;
  /** 세션 활성 상태 */
  isActive: boolean;
  /** 커서 위치 정보 */
  cursorPosition: {
    /** X 좌표 */
    x: number;
    /** Y 좌표 */
    y: number;
  } | null;
  // 레거시 필드 (호환성용)
  /** 프로젝트 ID (레거시) */
  project_id?: string;
  /** 사용자 ID (레거시) */
  user_id?: string;
  /** 커서 위치 (레거시) */
  cursor_position?: {
    /** X 좌표 */
    x: number;
    /** Y 좌표 */
    y: number;
  };
  /** 활성 상태 (레거시) */
  is_active?: boolean;
  /** 참가 시간 (레거시) */
  joined_at?: string;
  /** 마지막 활동 시간 (레거시) */
  last_activity?: string;
  /** 생성 시간 (레거시) */
  created_at?: string;
  /** 수정 시간 (레거시) */
  updated_at?: string;
}

/**
 * 코멘트 인터페이스
 * 프로젝트 내에서 사용자가 작성한 코멘트 정보
 */
export interface Comment {
  /** 코멘트 고유 식별자 */
  id: string;
  /** 프로젝트 ID */
  project_id: string;
  /** 사용자 ID (레거시) */
  user_id: string;
  /** 사용자 ID */
  userId: string;
  /** 작성자 사용자명 */
  username: string;
  /** 코멘트 내용 */
  content: string;
  /** 코멘트 위치 */
  position: {
    /** X 좌표 */
    x: number;
    /** Y 좌표 */
    y: number;
  };
  /** 부모 코멘트 ID (답글인 경우) */
  parent_id?: string;
  /** 해결 상태 */
  is_resolved: boolean;
  /** 해결된 시간 */
  resolved_at?: string;
  /** 해결한 사용자 ID */
  resolved_by?: string;
  /** 생성 시간 */
  created_at: string;
  /** 수정 시간 */
  updated_at?: string;
}

/**
 * 프로젝트 인터페이스
 * 협업 프로젝트의 기본 정보를 정의
 */
export interface Project {
  /** 프로젝트 고유 식별자 */
  id: string;
  /** 프로젝트 이름 */
  name: string;
  /** 프로젝트 설명 */
  description?: string;
  /** 프로젝트 소유자 ID */
  owner_id: string;
  /** 프로젝트 설정 */
  settings?: {
    /** 코멘트 허용 여부 */
    allow_comments: boolean;
    /** 게스트 허용 여부 */
    allow_guests: boolean;
    /** 최대 참여자 수 */
    max_participants?: number;
  };
  /** 생성 시간 */
  created_at: string;
  /** 수정 시간 */
  updated_at?: string;
}

/**
 * 마우스 위치 인터페이스
 * 마우스의 현재 위치와 관련 정보를 저장
 */
export interface MousePosition {
  /** X 좌표 */
  x: number;
  /** Y 좌표 */
  y: number;
  /** 뷰포트 상대 X 좌표 */
  viewport_x?: number;
  /** 뷰포트 상대 Y 좌표 */
  viewport_y?: number;
  /** 현재 페이지 URL */
  page_url?: string;
  /** DOM 요소 경로 */
  element_path?: string;
}

/**
 * 마우스 경로 인터페이스
 * 마우스 이동 경로를 추적하고 저장
 */
export interface MousePath {
  /** 경로 고유 식별자 */
  id?: string;
  /** 사용자 ID */
  user_id: string;
  /** 프로젝트 ID */
  project_id: string;
  /** 마우스 이동 경로 데이터 배열 */
  path_data: MousePosition[];
  /** 경로 기록 시작 시간 */
  start_time: string;
  /** 경로 기록 종료 시간 */
  end_time?: string;
  /** 경로 기록 활성 상태 */
  is_active: boolean;
}

/**
 * 커서 이동 이벤트 인터페이스
 * 실시간 커서 이동 정보를 전달하는 이벤트
 */
export interface CursorMoveEvent {
  /** 사용자 ID */
  user_id: string;
  /** 사용자명 */
  username: string;
  /** 마우스 위치 */
  position: MousePosition;
  /** 마우스 이동 속도 */
  velocity?: {
    /** X축 속도 */
    dx: number;
    /** Y축 속도 */
    dy: number;
  };
  /** 이벤트 발생 시간 */
  timestamp: string;
  /** 사용자별 커서 색상 */
  color?: string;
}

/**
 * 마우스 궤적 이벤트 인터페이스
 * 마우스 이동 궤적을 실시간으로 전달
 */
export interface MouseTrailEvent {
  /** 사용자 ID */
  user_id: string;
  /** 사용자명 */
  username: string;
  /** 최근 마우스 위치 배열 */
  trail: MousePosition[];
  /** 이벤트 발생 시간 */
  timestamp: string;
}

/**
 * 코멘트 이벤트 인터페이스
 * 코멘트 관련 액션 이벤트를 정의
 */
export interface CommentEvent {
  /** 이벤트 액션 타입 */
  action: 'created' | 'updated' | 'deleted' | 'resolved';
  /** 코멘트 정보 */
  comment: Comment;
  /** 액션을 수행한 사용자 ID */
  user_id: string;
  /** 이벤트 발생 시간 */
  timestamp: string;
}

/**
 * 사용자 상태 인터페이스
 * 실시간 사용자 참여 상태를 관리
 */
export interface PresenceState {
  /** 사용자 ID */
  user_id: string;
  /** 사용자명 */
  username: string;
  /** 온라인 시작 시간 */
  online_at: string;
  /** 현재 커서 위치 */
  cursor_position?: {
    /** X 좌표 */
    x: number;
    /** Y 좌표 */
    y: number;
  };
  /** 활성 상태 */
  is_active: boolean;
}

/**
 * 코멘트 생성 DTO
 * 새로운 코멘트 생성 시 필요한 데이터
 */
export interface CreateCommentDto {
  /** 코멘트 내용 */
  content: string;
  /** 코멘트 위치 */
  position: {
    /** X 좌표 */
    x: number;
    /** Y 좌표 */
    y: number;
  };
  /** 부모 코멘트 ID (답글인 경우) */
  parent_id?: string;
}

/**
 * 커서 업데이트 DTO
 * 커서 위치 업데이트 시 필요한 데이터
 */
export interface UpdateCursorDto {
  /** 마우스 위치 정보 */
  position: MousePosition;
  /** 마우스 이동 속도 */
  velocity?: {
    /** X축 속도 */
    dx: number;
    /** Y축 속도 */
    dy: number;
  };
  /** 커서 색상 */
  color?: string;
}

/**
 * 마우스 궤적 DTO
 * 마우스 이동 궤적 전송 시 필요한 데이터
 */
export interface MouseTrailDto {
  /** 마우스 위치 궤적 배열 */
  trail: MousePosition[];
  /** 배치 전송 크기 (한 번에 보낼 좌표 개수) */
  batchSize?: number;
}

/**
 * 프로젝트 참가 DTO
 * 프로젝트 세션 참가 시 필요한 데이터
 */
export interface JoinProjectDto {
  /** 사용자명 */
  username: string;
  /** 사용자 이메일 */
  userEmail?: string;
  /** 사용자 프로필 이미지 URL */
  userAvatar?: string;
  /** 이메일 (레거시 호환용) */
  email?: string;
  /** 프로필 이미지 (레거시 호환용) */
  avatar?: string;
}

/**
 * Supabase 테이블 이름 상수
 * 데이터베이스 테이블 이름을 정의
 */
export const SUPABASE_TABLES = {
  PROJECTS: 'projects',
  PROJECT_SESSIONS: 'project_sessions',
  COMMENTS: 'comments',
} as const;

/**
 * 실시간 이벤트 이름 상수
 * Socket.io 등에서 사용하는 실시간 이벤트명을 정의
 */
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
