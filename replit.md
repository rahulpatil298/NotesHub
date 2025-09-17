# Overview

This is a multi-tenant Notes SaaS application built with a full-stack TypeScript architecture. The application allows multiple organizations (tenants) to manage their notes with user authentication and role-based access control. It features a React frontend with shadcn/ui components and an Express.js backend with MongoDB integration.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Single-page application using React 18 with TypeScript for type safety
- **Vite Build System**: Fast development server and optimized production builds
- **Routing**: Client-side routing using Wouter for lightweight navigation
- **UI Components**: shadcn/ui component library with Radix UI primitives and Tailwind CSS styling
- **State Management**: TanStack React Query for server state management and caching
- **Authentication**: JWT token-based authentication stored in localStorage

## Backend Architecture
- **Express.js Server**: RESTful API server with TypeScript support
- **Multi-tenant Data Model**: Shared schema approach where all data includes tenantId for tenant isolation
- **Authentication Middleware**: JWT-based authentication with role-based access control (Admin/Member roles)
- **CORS Configuration**: Enabled for cross-origin requests with specific origin allowlisting
- **Database Layer**: Abstracted storage interface with in-memory implementation (ready for MongoDB integration)

## Data Storage
- **Database**: Configured for PostgreSQL using Drizzle ORM (with Neon serverless)
- **Multi-tenancy**: Shared schema approach with tenantId field in all tenant-scoped data
- **Schema Design**: Three main entities - Tenants (organizations), Users (with tenant association), and Notes (tenant-scoped content)
- **Migrations**: Database schema versioning using Drizzle Kit

## Authentication & Authorization
- **JWT Tokens**: Stateless authentication using JSON Web Tokens
- **Password Security**: bcryptjs for password hashing and verification
- **Role-based Access**: Two-tier role system (Admin/Member) with different permissions
- **Tenant Isolation**: All API endpoints enforce tenant-level data separation

## API Design
- **RESTful Endpoints**: Standard HTTP methods for CRUD operations
- **Health Check**: Monitoring endpoint for service availability
- **Error Handling**: Centralized error middleware with proper HTTP status codes
- **Request Validation**: Schema validation using Zod for type-safe request/response handling

# External Dependencies

## Database & ORM
- **Neon Database**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database queries and schema management
- **Database Connection**: @neondatabase/serverless for optimized serverless connections

## UI Framework & Components
- **shadcn/ui**: Pre-built React components with Radix UI primitives
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, forms, etc.)
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography

## Authentication & Security
- **bcryptjs**: Password hashing and verification
- **jsonwebtoken**: JWT token creation and verification
- **CORS**: Cross-origin resource sharing configuration

## Development Tools
- **TypeScript**: Static type checking across frontend and backend
- **Vite**: Fast development server and build tool
- **ESBuild**: JavaScript bundler for production builds
- **Replit Integration**: Development environment plugins for Replit platform

## State Management & HTTP
- **TanStack React Query**: Server state management, caching, and synchronization
- **date-fns**: Date formatting and manipulation utilities
- **nanoid**: Unique ID generation for database records