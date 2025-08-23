# FinanceFlow - Personal Financial Management System

## Overview

FinanceFlow is a comprehensive personal and family financial management system built to help users organize, track, and improve their financial health. The application features transaction management, investment tracking, AI-powered insights, and detailed reporting capabilities with a modern, responsive interface.

The system is designed as a full-stack web application with a React frontend and Express.js backend, utilizing PostgreSQL for data persistence and featuring secure authentication through Replit's OpenID Connect system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management with optimistic updates
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Charts**: Recharts library for financial data visualization
- **Theme System**: Custom theme provider supporting light/dark mode with CSS variables

### Backend Architecture
- **Runtime**: Node.js with Express.js framework using ESM modules
- **Database ORM**: Drizzle ORM with Neon PostgreSQL for type-safe database operations
- **Authentication**: Replit OpenID Connect integration with session-based auth using connect-pg-simple
- **API Design**: RESTful API with consistent error handling and request/response patterns
- **Session Storage**: PostgreSQL-backed sessions for secure user state management
- **Development Server**: Vite integration for hot module replacement in development

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM with PostgreSQL dialect for schema management and queries
- **Schema Design**: Normalized relational structure with proper foreign key relationships
- **Migration System**: Drizzle Kit for database schema migrations and updates
- **Connection Pooling**: Neon serverless pooling for efficient database connections

### Authentication and Authorization
- **Provider**: Replit OpenID Connect for seamless authentication
- **Session Management**: Server-side sessions stored in PostgreSQL using connect-pg-simple
- **Route Protection**: Middleware-based authentication checking for protected API endpoints
- **User Management**: Automatic user creation/updates on successful authentication
- **Security**: HTTP-only cookies with secure session configuration

### Data Models
- **Users**: Profile information and account settings with individual/family account types
- **Categories**: Customizable expense and income categories with icons and colors
- **Transactions**: Income and expense records with payment methods and receipt attachments
- **Fixed Expenses**: Recurring monthly expenses with payment status tracking
- **Investments**: Portfolio tracking with types, amounts, and performance history
- **Budget Goals**: Financial targets and progress tracking

### API Structure
- **Authentication Routes**: `/api/auth/*` for login/logout and user session management
- **Resource Routes**: RESTful endpoints for transactions, categories, investments, etc.
- **Financial Analytics**: Aggregated data endpoints for dashboard insights and reporting
- **File Upload**: Support for receipt and document attachments (planned)

### Build and Deployment
- **Development**: Vite dev server with HMR and TypeScript checking
- **Build Process**: Vite for frontend bundling, esbuild for backend compilation
- **Production**: Single-file deployment with static asset serving
- **Environment**: Environment variable configuration for database and auth secrets