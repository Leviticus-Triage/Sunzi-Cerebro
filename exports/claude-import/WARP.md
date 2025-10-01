# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Quick Start

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check TypeScript types
npm run type-check

# Run linting
npm run lint
```

The development server runs on **port 3000** and binds to `0.0.0.0` for network access.

## Common Development Commands

### Development Server
- `npm run dev` - Start development server on http://localhost:3000 with hot reload
- `npm run preview` - Preview production build locally

### Build & Production
- `npm run build` - Create production build in `/dist` directory
- `npm run type-check` - Run TypeScript compiler without emitting files

### Code Quality
- `npm run lint` - Run ESLint on TypeScript/TSX files
- `npm run lint --fix` - Auto-fix linting issues where possible

### Dependencies
- `npm install` - Install all dependencies
- `npm ci` - Clean install for production/CI environments

## Architecture Overview

### Project Structure
```
src/
├── components/          # Reusable UI components
│   └── Layout/         # Main layout component with sidebar navigation
├── pages/              # Route-based page components
│   ├── Dashboard/      # Main dashboard page
│   ├── Tools/          # Security tools management
│   ├── Scans/          # Scan management and monitoring
│   ├── Reports/        # Report generation and viewing
│   ├── Settings/       # Application settings
│   ├── Login/          # Authentication page
│   └── NotFound/       # 404 error page
├── hooks/              # Custom React hooks
│   └── useAuth.ts      # Authentication and authorization logic
├── theme/              # Material-UI theme configuration
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Technology Stack
- **React 18** with TypeScript for type safety
- **Vite** as build tool and development server
- **Material-UI (MUI)** for UI components with Sunzi Cerebro theming
- **React Router** for client-side routing
- **React Query** for server state management
- **Axios** for HTTP requests
- **TailwindCSS** for additional styling utilities

### State Management
- **React Context** for authentication state (`AuthProvider`)
- **React Query** for server state and caching
- **Local Storage** for JWT token persistence

### Authentication Flow
- JWT-based authentication with role-based access control
- Roles: `admin`, `pentester`, `analyst`, `viewer`
- Token stored in localStorage with automatic validation
- Protected routes with permission checks

## MCP Integration

### API Configuration
The frontend is designed to communicate with the Sunzi Cerebro MCP orchestrator ecosystem:

- **Primary Backend**: `http://localhost:8890` (HexStrike AI server)
- **Environment Variables**: Configure via `.env` file based on `.env.example`
- **Request Interceptors**: Axios configured with JWT tokens in Authorization headers

### MCP Server Endpoints
```typescript
// Expected backend structure for MCP integration
VITE_API_BASE_URL=http://localhost:8890  // HexStrike AI server
VITE_API_TIMEOUT=30000                   // Request timeout
```

### Security Tool Integration
- Tools page connects to MCP servers for security tool management
- Real-time scan monitoring through API polling or WebSocket connections
- Report generation from MCP server scan results

## Development Setup

### Environment Variables
Create `.env` file from `.env.example`:
```env
VITE_API_BASE_URL=http://localhost:8890
VITE_APP_NAME=Sunzi Cerebro
VITE_APP_VERSION=1.0.0
VITE_DEV_MODE=true
VITE_MOCK_API=false
```

### Port Configuration
- **Frontend**: Port 3000 (Vite dev server)
- **Backend API**: Port 8890 (HexStrike AI server)
- **Network binding**: `0.0.0.0` for external access

### Prerequisites
- Node.js 18+ (as specified in README)
- npm or yarn
- Python 3.13 (for MCP server integrations)
- Go tools (for security tool dependencies)

## Project Conventions

### File Naming
- Components: PascalCase (e.g., `Dashboard.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`)
- Pages: PascalCase with directory structure
- Types: PascalCase interfaces and types

### Component Structure
- Each page/component has its own directory with `index.ts` for clean imports
- Layout component provides consistent navigation and authentication checks
- Role-based rendering using `hasPermission` utility

### Styling Approach
- Material-UI components as base layer
- Custom theme with Sunzi Cerebro color palette
- TailwindCSS for utility classes and responsive design
- Theme colors: Primary `#00327c`, Success `#00ca82`, Warning `#ff9b26`, Error `#fb5454`

### TypeScript Patterns
- Strict TypeScript configuration enabled
- Interface definitions for all API responses and component props
- Path mapping with `@/*` for src directory imports

## Troubleshooting

### Common Issues

**Dev server won't start / JSX syntax errors:**
- Ensure React is imported in files using JSX: `import React from 'react'`
- Check that all import paths are correct and files exist

**Authentication infinite loading:**
- Check that backend API on port 8890 is running
- Verify API endpoint configuration in `.env`
- Check browser network tab for API request failures

**Build failures:**
- Run `npm run type-check` to identify TypeScript errors
- Check for missing dependencies with `npm install`
- Verify all imports have correct file extensions

**Permission/Role issues:**
- Check user role in browser's localStorage (`sunzi_user`)
- Verify `hasPermission` function logic in `useAuth.ts`
- Ensure backend returns correct user role information

### Debug Commands
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json && npm install

# Check for TypeScript issues without building
npm run type-check

# Start with verbose logging
DEBUG=* npm run dev
```

## Important Notes

### Security Considerations
- JWT tokens stored in localStorage (consider httpOnly cookies for production)
- Role-based access control implemented throughout the application
- API requests include Authorization headers automatically
- Demo credentials: `sunzi.cerebro` / `admin123` (development only)

### MCP Orchestration
- Follows Sun Tzu's principle of strategic, non-disruptive integration
- Designed to work with multiple MCP servers simultaneously
- Supports real-time updates from security tool executions
- Frontend acts as central command interface for distributed MCP operations

### Performance Notes
- React Query handles API caching and background updates
- Vite provides fast hot module replacement in development
- Material-UI components are tree-shakeable for smaller bundle size
- Source maps enabled for debugging in production builds

### Integration Points
- **Warp Terminal**: Works seamlessly with configurations in `/home/danii/.config/warp-terminal/`
- **MCP Ecosystem**: Designed for AttackMCP, Auto-Pentest-Orchestrator, MCP-God-Mode integration
- **Security Tools**: Frontend for managing Nmap, Burp Suite, Nuclei, and other security tools through MCP servers