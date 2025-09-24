-- Triad Database Initialization Script
-- PostgreSQL Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    username VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar TEXT,
    role VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'MODERATOR')),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED')),
    provider VARCHAR(20) DEFAULT 'LOCAL' CHECK (provider IN ('LOCAL', 'GOOGLE', 'GITHUB')),
    provider_id VARCHAR(255),
    provider_data JSONB,
    refresh_token VARCHAR(500),
    email_verified_at TIMESTAMP,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_provider_providerid ON users(provider, provider_id);

-- Projects table (for collaboration)
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url VARCHAR(500),
    domain VARCHAR(255),
    is_public BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create indexes for projects table
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_url ON projects(url);
CREATE INDEX idx_projects_domain ON projects(domain);

-- Project sessions table (active collaboration sessions)
CREATE TABLE IF NOT EXISTS project_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    user_email VARCHAR(255),
    user_avatar TEXT,
    is_active BOOLEAN DEFAULT true,
    cursor_position JSONB,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for project_sessions table
CREATE INDEX idx_project_sessions_project_id ON project_sessions(project_id);
CREATE INDEX idx_project_sessions_user_id ON project_sessions(user_id);
CREATE INDEX idx_project_sessions_is_active ON project_sessions(is_active);
CREATE INDEX idx_project_sessions_last_activity ON project_sessions(last_activity);

-- Comment threads table
CREATE TABLE IF NOT EXISTS comment_threads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    url VARCHAR(500),
    page_title VARCHAR(255),
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create indexes for comment_threads table
CREATE INDEX idx_comment_threads_project_id ON comment_threads(project_id);
CREATE INDEX idx_comment_threads_url ON comment_threads(url);
CREATE INDEX idx_comment_threads_is_resolved ON comment_threads(is_resolved);

-- Deployments table
CREATE TABLE IF NOT EXISTS deployments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    deployment_url VARCHAR(500) NOT NULL,
    environment VARCHAR(50) DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production', 'preview')),
    version VARCHAR(50),
    commit_sha VARCHAR(40),
    deployed_by UUID REFERENCES users(id),
    deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'failed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for deployments table
CREATE INDEX idx_deployments_project_id ON deployments(project_id);
CREATE INDEX idx_deployments_deployment_url ON deployments(deployment_url);
CREATE INDEX idx_deployments_environment ON deployments(environment);
CREATE INDEX idx_deployments_status ON deployments(status);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_id UUID REFERENCES comment_threads(id) ON DELETE CASCADE,
    body JSONB, -- Structured content for rich text
    content TEXT NOT NULL, -- Plain text version
    images JSONB DEFAULT '[]', -- Array of image URLs
    commit_sha VARCHAR(40), -- Git commit reference
    href VARCHAR(500), -- Link reference
    left_on_localhost BOOLEAN DEFAULT false,
    deployment_id UUID REFERENCES deployments(id),
    position JSONB NOT NULL, -- {x: number, y: number}
    parent_id UUID REFERENCES comments(id),
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id),
    url VARCHAR(500), -- Chrome Extension URL
    xpath TEXT, -- DOM path
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create indexes for comments table
CREATE INDEX idx_comments_project_id ON comments(project_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_is_resolved ON comments(is_resolved);
CREATE INDEX idx_comments_thread_id ON comments(thread_id);

-- Mutations table (for tracking DOM changes)
CREATE TABLE IF NOT EXISTS mutations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('added', 'removed', 'modified', 'style', 'attribute')),
    target_selector VARCHAR(500),
    target_xpath TEXT,
    old_value TEXT,
    new_value TEXT,
    metadata JSONB DEFAULT '{}',
    url VARCHAR(500),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for mutations table
CREATE INDEX idx_mutations_project_id ON mutations(project_id);
CREATE INDEX idx_mutations_user_id ON mutations(user_id);
CREATE INDEX idx_mutations_type ON mutations(type);
CREATE INDEX idx_mutations_timestamp ON mutations(timestamp);
CREATE INDEX idx_mutations_url ON mutations(url);

-- Plan tiers table (for subscription management)
CREATE TABLE IF NOT EXISTS plan_tiers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) DEFAULT 0,
    price_yearly DECIMAL(10, 2) DEFAULT 0,
    features JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}', -- {max_projects: 5, max_team_members: 10, etc.}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for plan_tiers table
CREATE INDEX idx_plan_tiers_name ON plan_tiers(name);
CREATE INDEX idx_plan_tiers_is_active ON plan_tiers(is_active);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_tier_id UUID NOT NULL REFERENCES plan_tiers(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'trialing', 'past_due')),
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMP,
    trial_end TIMESTAMP,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for subscriptions table
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan_tier_id ON subscriptions(plan_tier_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- Usage records table (for tracking feature usage)
CREATE TABLE IF NOT EXISTS usage_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    feature VARCHAR(100) NOT NULL, -- 'projects', 'team_members', 'comments', etc.
    quantity INTEGER DEFAULT 1,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for usage_records table
CREATE INDEX idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX idx_usage_records_subscription_id ON usage_records(subscription_id);
CREATE INDEX idx_usage_records_feature ON usage_records(feature);
CREATE INDEX idx_usage_records_timestamp ON usage_records(timestamp);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_sessions_updated_at BEFORE UPDATE ON project_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comment_threads_updated_at BEFORE UPDATE ON comment_threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deployments_updated_at BEFORE UPDATE ON deployments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_tiers_updated_at BEFORE UPDATE ON plan_tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default plan tiers
INSERT INTO plan_tiers (name, display_name, description, price_monthly, price_yearly, features, limits)
VALUES
    ('free', 'Free', 'Perfect for personal projects and trying out Triad', 0, 0,
     '{"comments": true, "realtime_cursors": true, "chrome_extension": true}',
     '{"max_projects": 3, "max_team_members": 2, "max_comments_per_month": 100}'),

    ('pro', 'Professional', 'For professional developers and small teams', 19.99, 199.99,
     '{"comments": true, "realtime_cursors": true, "chrome_extension": true, "priority_support": true, "custom_branding": true}',
     '{"max_projects": 20, "max_team_members": 10, "max_comments_per_month": -1}'),

    ('team', 'Team', 'For growing teams with advanced collaboration needs', 49.99, 499.99,
     '{"comments": true, "realtime_cursors": true, "chrome_extension": true, "priority_support": true, "custom_branding": true, "sso": true, "api_access": true}',
     '{"max_projects": -1, "max_team_members": 50, "max_comments_per_month": -1}'),

    ('enterprise', 'Enterprise', 'Custom solutions for large organizations', 0, 0,
     '{"comments": true, "realtime_cursors": true, "chrome_extension": true, "priority_support": true, "custom_branding": true, "sso": true, "api_access": true, "on_premise": true, "dedicated_support": true}',
     '{"max_projects": -1, "max_team_members": -1, "max_comments_per_month": -1}')
ON CONFLICT (name) DO NOTHING;

-- Grant permissions (adjust based on your database user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;