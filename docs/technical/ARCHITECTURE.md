# Sunzi Cerebro - System Architecture

## Overview

Sunzi Cerebro is an enterprise-grade AI-powered security platform that combines traditional cybersecurity with Sun Tzu's strategic principles. The system integrates 340+ security tools through MCP (Model Context Protocol) and provides automated compliance reporting.

## Core Components

### 1. Frontend (Port 3000)

- **Technology Stack**: React 18.3.1, TypeScript, Material-UI
- **Key Features**:
  - Interactive dashboard with real-time security insights
  - 13 Sun Tzu strategic module interfaces
  - Compliance reporting visualization (NIS-2, GDPR, ISO 27001)
  - Real-time threat monitoring

### 2. Backend API (Port 8890)

- **Technology Stack**: Node.js, Express
- **Key Features**:
  - 15+ RESTful endpoints for security operations
  - WebSocket integration for real-time updates
  - SQLite database integration
  - Authentication and authorization layer

### 3. MCP Integration Layer

- **Components**:
  - MCP-God-Mode: 152 integrated security tools
  - HexStrike AI: 124 specialized security tools
  - Custom protocol adapters for tool orchestration

### 4. Database Layer

- **Technology**: SQLite (Production System)
- **Key Features**:
  - Secure credential storage
  - Audit logging
  - Compliance report archiving
  - Tool execution history

## System Integration

### Data Flow

```
[Frontend UI] <-> [Backend API] <-> [MCP Integration] <-> [Security Tools]
     ^               ^
     |               |
     +------ WebSocket ------+
```

### Security Tool Integration

1. **MCP-God-Mode Tools** (152)

   - Network scanning
   - Vulnerability assessment
   - Threat detection
   - Compliance checking

2. **HexStrike AI Tools** (124)
   - AI-powered threat analysis
   - Pattern recognition
   - Automated response planning
   - Strategic decision support

## Deployment Architecture

### Development Environment

```
├── Local Development
│   ├── Frontend (localhost:3000)
│   ├── Backend API (localhost:8890)
│   └── SQLite Database (local file)
```

### Production Environment

```
├── Docker Containers
│   ├── Frontend Nginx
│   ├── Backend Node.js
│   ├── Database
│   └── MCP Integration Services
└── Kubernetes Cluster
    ├── Frontend Pods
    ├── Backend API Pods
    ├── Database StatefulSet
    └── Tool Integration Pods
```

## Security Architecture

### Authentication & Authorization

- JWT-based authentication
- Role-based access control (RBAC)
- API key management for tool integration

### Data Security

- End-to-end encryption for sensitive data
- Secure credential storage
- Audit logging for all operations

### Compliance Integration

- Automated NIS-2 compliance checking
- GDPR compliance monitoring
- ISO 27001 control mapping

## AI Integration

### Strategic Analysis

- Sun Tzu principle mapping
- Threat pattern recognition
- Risk assessment automation

### Automated Response

- AI-driven incident response
- Strategic recommendation engine
- Learning from historical data

## Monitoring & Logging

### System Monitoring

- Real-time performance metrics
- Resource utilization tracking
- Error rate monitoring

### Security Logging

- Comprehensive audit trails
- Security incident logging
- Compliance violation alerts

## Future Extensibility

### Planned Enhancements

- Additional compliance framework integration
- Extended AI capabilities
- More security tool integrations
- Enhanced automation features
