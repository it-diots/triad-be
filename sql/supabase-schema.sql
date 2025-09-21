-- Supabase 데이터베이스 스키마 생성 SQL
-- Supabase SQL Editor에서 실행하세요

-- projects 테이블 생성
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id VARCHAR(255) NOT NULL,
  settings JSONB DEFAULT '{"allow_comments": true, "allow_guests": false, "max_participants": 50}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- project_sessions 테이블 생성 (활성 사용자 세션 추적)
CREATE TABLE IF NOT EXISTS project_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  user_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  cursor_position JSONB,
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 복합 인덱스: 한 프로젝트에서 사용자별로 하나의 활성 세션만 허용
  UNIQUE(project_id, user_id)
);

-- comments 테이블 생성
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  position JSONB NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_project_sessions_project_id ON project_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_sessions_user_id ON project_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_sessions_active ON project_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_resolved ON comments(is_resolved);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- projects 테이블 트리거
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- project_sessions 테이블 트리거
CREATE TRIGGER update_project_sessions_updated_at BEFORE UPDATE ON project_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- comments 테이블 트리거
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 정책 설정
-- 먼저 RLS를 활성화합니다
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- projects 테이블 정책
-- 모든 인증된 사용자가 프로젝트를 조회할 수 있음
CREATE POLICY "Projects are viewable by all authenticated users" ON projects
  FOR SELECT USING (true);

-- 프로젝트 소유자만 수정/삭제 가능
CREATE POLICY "Projects are editable by owner" ON projects
  FOR UPDATE USING (auth.uid()::text = owner_id);

CREATE POLICY "Projects are deletable by owner" ON projects
  FOR DELETE USING (auth.uid()::text = owner_id);

-- 인증된 사용자는 프로젝트 생성 가능
CREATE POLICY "Authenticated users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid()::text = owner_id);

-- project_sessions 테이블 정책
-- 모든 인증된 사용자가 세션을 조회할 수 있음
CREATE POLICY "Sessions are viewable by all authenticated users" ON project_sessions
  FOR SELECT USING (true);

-- 자신의 세션만 생성/수정/삭제 가능
CREATE POLICY "Users can manage their own sessions" ON project_sessions
  FOR ALL USING (auth.uid()::text = user_id);

-- comments 테이블 정책
-- 모든 인증된 사용자가 코멘트를 조회할 수 있음
CREATE POLICY "Comments are viewable by all authenticated users" ON comments
  FOR SELECT USING (true);

-- 인증된 사용자는 코멘트 생성 가능
CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 자신의 코멘트만 수정/삭제 가능
CREATE POLICY "Users can manage their own comments" ON comments
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid()::text = user_id);

-- 샘플 프로젝트 데이터 삽입 (선택사항)
-- INSERT INTO projects (name, description, owner_id) VALUES
-- ('Sample Project 1', 'This is a sample project for testing', 'user-1'),
-- ('Sample Project 2', 'Another test project', 'user-2');

-- Realtime 구독 활성화
-- Supabase 대시보드에서 다음 테이블들의 Realtime을 활성화해야 합니다:
-- 1. project_sessions 테이블
-- 2. comments 테이블

-- SQL Editor에서 실행 (Realtime 활성화)
ALTER PUBLICATION supabase_realtime ADD TABLE project_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- 성능 최적화를 위한 추가 인덱스 (필요시)
-- CREATE INDEX IF NOT EXISTS idx_project_sessions_last_activity ON project_sessions(last_activity DESC);
-- CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);