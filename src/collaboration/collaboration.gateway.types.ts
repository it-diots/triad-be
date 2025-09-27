export interface CursorPosition {
  x: number;
  y: number;
  absoluteX?: number;
  absoluteY?: number;
  elementX?: number;
  elementY?: number;
  userId: string;
  username: string;
  color?: string;
  viewport?: { width: number; height: number };
  timestamp?: number;
}

export interface SessionComment {
  id: string;
  userId: string;
  username: string;
  content: string;
  position: { x: number; y: number };
  timestamp: Date;
  url?: string;
  xpath?: string;
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface ExtensionSession {
  url: string;
  domain: string;
  path: string;
  projectId?: string;
  users: Map<string, UserInfo>;
  cursors: Map<string, CursorPosition>;
  comments: SessionComment[];
}

export type CursorMoveMessage = {
  url: string;
  x: number;
  y: number;
  elementX?: number;
  elementY?: number;
  viewport?: { width: number; height: number };
  scrollX?: number;
  scrollY?: number;
  color?: string;
};

export type CommentCreateMessage = {
  url: string;
  content: string;
  position: { x: number; y: number };
  xpath?: string;
};

export type ProjectCommentPayload = {
  id: string;
  userId?: string;
  user_id?: string;
  username: string;
  content: string;
  position: { x: number; y: number };
  created_at?: string;
};
