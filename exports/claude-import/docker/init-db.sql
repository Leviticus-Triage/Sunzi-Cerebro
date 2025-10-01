-- PostgreSQL Database Initialization for Sunzi Cerebro Enterprise
-- Creates enterprise-ready database with proper indexes and extensions

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create custom types for better data modeling
CREATE TYPE user_role AS ENUM (
    'super_admin',
    'admin',
    'pentester',
    'analyst',
    'viewer'
);

CREATE TYPE tenant_status AS ENUM (
    'active',
    'suspended',
    'trial',
    'expired'
);

CREATE TYPE subscription_tier AS ENUM (
    'free',
    'professional',
    'enterprise',
    'enterprise_plus'
);

CREATE TYPE execution_status AS ENUM (
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled',
    'timeout'
);

CREATE TYPE tool_category AS ENUM (
    'network_scanning',
    'vulnerability_assessment',
    'penetration_testing',
    'forensics',
    'mobile_security',
    'web_application',
    'database_security',
    'cloud_security',
    'malware_analysis',
    'social_engineering',
    'wireless_security',
    'reverse_engineering'
);

-- Tenants table (multi-tenancy support)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    status tenant_status DEFAULT 'trial',
    subscription_tier subscription_tier DEFAULT 'free',

    -- Resource limits
    max_users INTEGER DEFAULT 5,
    max_tool_executions_monthly INTEGER DEFAULT 100,
    max_concurrent_executions INTEGER DEFAULT 2,
    max_storage_mb INTEGER DEFAULT 1024,

    -- Current usage tracking
    current_users INTEGER DEFAULT 0,
    current_executions_monthly INTEGER DEFAULT 0,
    current_storage_mb INTEGER DEFAULT 0,

    -- Subscription details
    subscription_valid_until TIMESTAMP WITH TIME ZONE,
    billing_email VARCHAR(255),

    -- Security settings
    enforce_2fa BOOLEAN DEFAULT FALSE,
    allowed_ip_ranges TEXT[],
    session_timeout_minutes INTEGER DEFAULT 480,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT positive_max_users CHECK (max_users > 0),
    CONSTRAINT positive_max_executions CHECK (max_tool_executions_monthly > 0)
);

-- Organizations table (hierarchical structure within tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    description TEXT,
    level INTEGER DEFAULT 0,
    path TEXT, -- Materialized path for efficient hierarchy queries

    -- Settings
    default_tool_timeout_seconds INTEGER DEFAULT 300,
    allowed_tool_categories tool_category[],

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    UNIQUE(tenant_id, name),
    CHECK (level >= 0),
    CHECK (default_tool_timeout_seconds > 0)
);

-- Users table (enterprise user management)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

    -- Authentication
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    -- Profile information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    avatar_url VARCHAR(500),

    -- Role and permissions
    role user_role DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,

    -- 2FA settings
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    backup_codes TEXT[],

    -- API access
    api_key VARCHAR(255) UNIQUE,
    api_key_created_at TIMESTAMP WITH TIME ZONE,
    api_rate_limit INTEGER DEFAULT 1000, -- requests per hour

    -- Security tracking
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Preferences
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    theme VARCHAR(20) DEFAULT 'light',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    UNIQUE(tenant_id, username),
    UNIQUE(tenant_id, email),
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CHECK (failed_login_attempts >= 0),
    CHECK (api_rate_limit > 0)
);

-- User sessions table (session management)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    session_token VARCHAR(255) NOT NULL UNIQUE,
    refresh_token VARCHAR(255),

    -- Session metadata
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),

    -- Session lifecycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE,

    -- Security flags
    is_admin_session BOOLEAN DEFAULT FALSE,
    requires_2fa BOOLEAN DEFAULT FALSE,

    CHECK (expires_at > created_at)
);

-- Tool executions table (execution tracking and auditing)
CREATE TABLE IF NOT EXISTS tool_executions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

    -- Execution details
    execution_id VARCHAR(100) NOT NULL UNIQUE,
    tool_name VARCHAR(100) NOT NULL,
    tool_version VARCHAR(50),
    server_name VARCHAR(100) NOT NULL,
    category tool_category,

    -- Execution parameters and results
    parameters JSONB,
    output JSONB,
    findings JSONB,
    error_message TEXT,

    -- Status and timing
    status execution_status DEFAULT 'pending',
    priority INTEGER DEFAULT 5, -- 1-10 scale

    -- Timing information
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    timeout_seconds INTEGER DEFAULT 300,

    -- Resource usage
    memory_usage_mb INTEGER,
    cpu_usage_percent DECIMAL(5,2),

    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CHECK (priority BETWEEN 1 AND 10),
    CHECK (timeout_seconds > 0),
    CHECK (duration_ms IS NULL OR duration_ms >= 0),
    CHECK (completed_at IS NULL OR completed_at >= started_at)
);

-- Audit logs table (comprehensive audit trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Audit details
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,

    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id UUID,

    -- Change tracking
    old_values JSONB,
    new_values JSONB,

    -- Additional metadata
    metadata JSONB,
    severity VARCHAR(20) DEFAULT 'info',

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes will be created separately for performance
    CHECK (severity IN ('low', 'info', 'warning', 'high', 'critical'))
);

-- System metrics table (performance monitoring)
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Metric identification
    metric_name VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- counter, gauge, histogram, summary

    -- Metric data
    value DECIMAL(20,8) NOT NULL,
    labels JSONB,

    -- Timing
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Partitioning key for efficient querying
    date_partition DATE DEFAULT CURRENT_DATE,

    -- Indexes for time-series queries
    CHECK (metric_type IN ('counter', 'gauge', 'histogram', 'summary'))
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Notification channels
    email_enabled BOOLEAN DEFAULT TRUE,
    slack_webhook_url VARCHAR(500),
    discord_webhook_url VARCHAR(500),

    -- Notification types
    security_alerts BOOLEAN DEFAULT TRUE,
    tool_completion BOOLEAN DEFAULT TRUE,
    system_maintenance BOOLEAN DEFAULT TRUE,
    weekly_summary BOOLEAN DEFAULT TRUE,

    -- Preferences
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',
    timezone VARCHAR(50) DEFAULT 'UTC',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Create indexes for optimal performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenants_subscription ON tenants(subscription_tier, subscription_valid_until);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_tenant ON organizations(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_parent ON organizations(parent_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_path ON organizations USING GIN(path gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(tenant_id, email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON users(tenant_id, username);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_api_key ON users(api_key) WHERE api_key IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_activity ON user_sessions(last_activity_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_executions_tenant ON tool_executions(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_executions_user ON tool_executions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_executions_status ON tool_executions(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_executions_created ON tool_executions(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_executions_tool ON tool_executions(tool_name, server_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_executions_category ON tool_executions(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_executions_duration ON tool_executions(duration_ms) WHERE duration_ms IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_severity ON audit_logs(severity, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_name_timestamp ON system_metrics(metric_name, timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_partition ON system_metrics(date_partition, timestamp);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_labels ON system_metrics USING GIN(labels);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tool_executions_updated_at BEFORE UPDATE ON tool_executions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for organization path maintenance
CREATE OR REPLACE FUNCTION maintain_organization_path()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path = NEW.id::text;
        NEW.level = 0;
    ELSE
        SELECT path || '.' || NEW.id::text, level + 1
        INTO NEW.path, NEW.level
        FROM organizations
        WHERE id = NEW.parent_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER maintain_organization_path_trigger
    BEFORE INSERT OR UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION maintain_organization_path();

-- Create function for session cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions
    WHERE expires_at < NOW()
       OR revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '7 days';
END;
$$ language 'plpgsql';

-- Create function for metrics partitioning
CREATE OR REPLACE FUNCTION create_metrics_partition(partition_date DATE)
RETURNS void AS $$
DECLARE
    partition_name text;
    start_date date;
    end_date date;
BEGIN
    partition_name := 'system_metrics_' || to_char(partition_date, 'YYYY_MM_DD');
    start_date := partition_date;
    end_date := partition_date + INTERVAL '1 day';

    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF system_metrics
                    FOR VALUES FROM (%L) TO (%L)',
                   partition_name, start_date, end_date);
END;
$$ language 'plpgsql';

-- Set up table partitioning for system_metrics
ALTER TABLE system_metrics DETACH PARTITION IF EXISTS system_metrics_default;
-- Note: Partitioning setup would continue here based on specific requirements

-- Grant permissions for application user
GRANT USAGE ON SCHEMA public TO sunzi_cerebro;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sunzi_cerebro;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sunzi_cerebro;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO sunzi_cerebro;

-- Create read-only user for monitoring
CREATE USER sunzi_cerebro_readonly WITH PASSWORD 'readonly_2025';
GRANT CONNECT ON DATABASE sunzi_cerebro TO sunzi_cerebro_readonly;
GRANT USAGE ON SCHEMA public TO sunzi_cerebro_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO sunzi_cerebro_readonly;

COMMENT ON DATABASE sunzi_cerebro IS 'Sunzi Cerebro Enterprise Security Intelligence Platform Database';
COMMENT ON TABLE tenants IS 'Multi-tenant organization management with resource limits and billing';
COMMENT ON TABLE users IS 'Enterprise user management with RBAC and 2FA support';
COMMENT ON TABLE tool_executions IS 'Security tool execution tracking and results storage';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance and security';
COMMENT ON TABLE system_metrics IS 'Time-series metrics storage for monitoring and alerting';