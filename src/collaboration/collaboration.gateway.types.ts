/**
 * 커서 위치 인터페이스
 * 실시간 협업에서 사용자 커서의 상세 위치 정보를 정의
 */
export interface CursorPosition {
  /** X 좌표 */
  x: number;
  /** Y 좌표 */
  y: number;
  /** 절대 X 좌표 */
  absoluteX?: number;
  /** 절대 Y 좌표 */
  absoluteY?: number;
  /** 요소 기준 X 좌표 */
  elementX?: number;
  /** 요소 기준 Y 좌표 */
  elementY?: number;
  /** 사용자 ID */
  userId: string;
  /** 사용자명 */
  username: string;
  /** 커서 색상 */
  color?: string;
  /** 뷰포트 크기 정보 */
  viewport?: {
    /** 뷰포트 너비 */
    width: number;
    /** 뷰포트 높이 */
    height: number;
  };
  /** 타임스탬프 */
  timestamp?: number;
}

/**
 * 세션 코멘트 인터페이스
 * 협업 세션 내에서 생성된 코멘트 정보
 */
export interface SessionComment {
  /** 코멘트 ID */
  id: string;
  /** 작성자 ID */
  userId: string;
  /** 작성자명 */
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
  /** 작성 시간 */
  timestamp: Date;
  /** 코멘트가 작성된 페이지 URL */
  url?: string;
  /** DOM 경로 (XPath) */
  xpath?: string;
}

/**
 * 사용자 정보 인터페이스
 * 협업 세션에 참여한 사용자의 기본 정보
 */
export interface UserInfo {
  /** 사용자 ID */
  id: string;
  /** 사용자명 */
  username: string;
  /** 이메일 주소 */
  email: string;
  /** 프로필 이미지 URL */
  avatar?: string;
  /** 사용자 역할 */
  role?: string;
}

/**
 * JWT 페이로드 인터페이스
 * JWT 토큰에 포함되는 사용자 정보
 */
export interface JwtPayload {
  /** 토큰 주체 (사용자 ID) */
  sub: string;
  /** 사용자 이메일 */
  email: string;
  /** 사용자명 */
  username: string;
  /** 토큰 발행 시간 (초 단위 타임스탬프) */
  iat?: number;
  /** 토큰 만료 시간 (초 단위 타임스탬프) */
  exp?: number;
}

/**
 * 확장 프로그램 세션 인터페이스
 * 브라우저 확장 프로그램과 연동되는 협업 세션 정보
 */
export interface ExtensionSession {
  /** 현재 페이지 URL */
  url: string;
  /** 도메인 */
  domain: string;
  /** 페이지 경로 */
  path: string;
  /** 프로젝트 ID */
  projectId?: string;
  /** 세션 참여 사용자 맵 */
  users: Map<string, UserInfo>;
  /** 사용자별 커서 위치 맵 */
  cursors: Map<string, CursorPosition>;
  /** 세션 내 코멘트 목록 */
  comments: SessionComment[];
}

/**
 * 커서 이동 메시지 타입
 * 커서 이동 이벤트 시 전송되는 메시지 구조
 */
export type CursorMoveMessage = {
  /** 현재 페이지 URL */
  url: string;
  /** X 좌표 */
  x: number;
  /** Y 좌표 */
  y: number;
  /** 요소 기준 X 좌표 */
  elementX?: number;
  /** 요소 기준 Y 좌표 */
  elementY?: number;
  /** 뷰포트 크기 정보 */
  viewport?: {
    /** 뷰포트 너비 */
    width: number;
    /** 뷰포트 높이 */
    height: number;
  };
  /** 스크롤 X 위치 */
  scrollX?: number;
  /** 스크롤 Y 위치 */
  scrollY?: number;
  /** 커서 색상 */
  color?: string;
};

/**
 * 코멘트 생성 메시지 타입
 * 코멘트 생성 이벤트 시 전송되는 메시지 구조
 */
export type CommentCreateMessage = {
  /** 코멘트가 작성된 페이지 URL */
  url: string;
  /** 코멘트 내용 */
  content: string;
  /** 코멘트 위치 */
  position: {
    /** X 좌표 */
    x: number;
    /** Y 좌표 */
    y: number;
  };
  /** DOM 경로 (XPath) */
  xpath?: string;
};

/**
 * 프로젝트 코멘트 페이로드 타입
 * 프로젝트 내 코멘트 이벤트의 페이로드 구조
 */
export type ProjectCommentPayload = {
  /** 코멘트 ID */
  id: string;
  /** 사용자 ID (신규) */
  userId?: string;
  /** 사용자 ID (레거시) */
  user_id?: string;
  /** 작성자명 */
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
  /** 생성 시간 */
  created_at?: string;
};
