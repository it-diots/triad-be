-- Initial database setup for Triad

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database if not exists (run as superuser)
-- This is optional as docker-compose already creates the database

-- Grant all privileges to the user
GRANT ALL PRIVILEGES ON DATABASE triad_db TO postgres;

-- Create enum types
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'MODERATOR');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE project_status AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- Initial schema setup will be handled by TypeORM migrations
-- This file is for any initial database configurations