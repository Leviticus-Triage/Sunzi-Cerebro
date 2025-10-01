-- Sunzi Cerebro PostgreSQL Database Schema
-- Phase 5 Production Database Structure

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- MCP Servers Registry
CREATE TABLE mcp_servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    protocol VARCHAR(10) DEFAULT 'http',
    status VARCHAR(20) DEFAULT 'unknown',
    server_type VARCHAR(20) DEFAULT 'http_api',
    tool_count INTEGER DEFAULT 0,
    endpoints JSONB,
    configuration JSONB,
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MCP Tools Registry
CREATE TABLE mcp_tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id VARCHAR(100) UNIQUE NOT NULL,
    server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'miscellaneous',
    risk_level VARCHAR(10) DEFAULT 'medium',
    parameters JSONB,
    schema_def JSONB,
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    is_enabled BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tool Executions Log
CREATE TABLE tool_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id VARCHAR(100) UNIQUE NOT NULL,
    tool_id UUID REFERENCES mcp_tools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parameters JSONB,
    options JSONB,
    status VARCHAR(20) DEFAULT 'queued',
    progress INTEGER DEFAULT 0,
    result JSONB,
    output TEXT[],
    error_message TEXT,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    request_id VARCHAR(100),
    user_agent TEXT
);

-- Security Scans
CREATE TABLE security_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target VARCHAR(255) NOT NULL,
    scan_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    tools_used JSONB,
    results JSONB,
    findings INTEGER DEFAULT 0,
    severity_counts JSONB,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Scan Results and Findings
CREATE TABLE scan_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID REFERENCES security_scans(id) ON DELETE CASCADE,
    tool_execution_id UUID REFERENCES tool_executions(id) ON DELETE SET NULL,
    finding_type VARCHAR(50) NOT NULL,
    severity VARCHAR(10) DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target VARCHAR(255),
    port INTEGER,
    service VARCHAR(100),
    vulnerability_id VARCHAR(100),
    cvss_score DECIMAL(3,1),
    evidence JSONB,
    remediation TEXT,
    false_positive BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Configuration
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_mcp_servers_server_id ON mcp_servers(server_id);
CREATE INDEX idx_mcp_servers_status ON mcp_servers(status);
CREATE INDEX idx_mcp_tools_tool_id ON mcp_tools(tool_id);
CREATE INDEX idx_mcp_tools_server_id ON mcp_tools(server_id);
CREATE INDEX idx_mcp_tools_category ON mcp_tools(category);
CREATE INDEX idx_tool_executions_execution_id ON tool_executions(execution_id);
CREATE INDEX idx_tool_executions_user_id ON tool_executions(user_id);
CREATE INDEX idx_tool_executions_status ON tool_executions(status);
CREATE INDEX idx_tool_executions_start_time ON tool_executions(start_time);
CREATE INDEX idx_security_scans_scan_id ON security_scans(scan_id);
CREATE INDEX idx_security_scans_user_id ON security_scans(user_id);
CREATE INDEX idx_security_scans_status ON security_scans(status);
CREATE INDEX idx_scan_results_scan_id ON scan_results(scan_id);
CREATE INDEX idx_scan_results_severity ON scan_results(severity);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Create Functions for Updated Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert Default Configuration
INSERT INTO system_config (config_key, config_value, description) VALUES
('app.name', '"Sunzi Cerebro"', 'Application name'),
('app.version', '"3.2.0-dev"', 'Application version'),
('security.session_timeout', '3600', 'Session timeout in seconds'),
('mcp.discovery_interval', '300', 'MCP server discovery interval in seconds'),
('mcp.execution_timeout', '300', 'Default tool execution timeout in seconds'),
('notifications.enabled', 'true', 'Enable system notifications'),
('debug.level', '"info"', 'System debug level')
ON CONFLICT (config_key) DO NOTHING;

-- Insert Default Admin User (password: 'admin123' - CHANGE IN PRODUCTION)
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@sunzi-cerebro.local', crypt('admin123', gen_salt('bf')), 'admin')
ON CONFLICT (username) DO NOTHING;