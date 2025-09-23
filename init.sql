-- MySQL 초기화 스크립트 for Triad
-- 데이터베이스 생성 (docker-compose에서 이미 생성되지만 확실히 하기 위해)
CREATE DATABASE IF NOT EXISTS triad_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE triad_db;

-- 권한 부여 (MySQL 방식)
-- GRANT ALL PRIVILEGES ON triad_db.* TO 'triad_user'@'%';
-- FLUSH PRIVILEGES;

-- TypeORM이 자동으로 스키마를 생성하므로, 여기서는 기본 설정만 합니다.
-- 필요한 경우 초기 데이터나 추가 설정을 여기에 추가할 수 있습니다.