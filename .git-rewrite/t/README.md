# 🎭 Persona Platform

AI-powered persona simulation platform for better team communication and organizational empathy training.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)

## 📋 Overview

Persona Platform helps organizations understand their teams better through AI-generated personas. Companies send questionnaires to employees, and the system automatically generates representative personas that users can interact with through natural conversations.

### Key Features

- 🏢 **Multi-tenant Architecture** - Each company has isolated data and personas
- 📝 **Smart Questionnaires** - Template-based with custom question support
- 🤖 **AI Persona Generation** - Automatic clustering and persona creation from responses
- 💬 **Natural Conversations** - Chat with AI personas powered by Llama 3
- 🔍 **Find My Persona** - Discover which persona matches you best
- 👥 **Role-Based Access** - Super Admin, Company Admin, and User roles
- 🔐 **OAuth Integration** - Google and Microsoft sign-in support

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   React SPA     │────▶│  Express API    │────▶│   PostgreSQL    │
│   (Frontend)    │     │   (Backend)     │     │   (Database)    │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │   Groq API      │
                        │   (Llama 3)     │
                        │                 │
                        └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL (or use Docker)
- Groq API key (free tier available at https://console.groq.com)

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd persona-platform

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env

# Start all services
docker-compose up -d

# The app will be available at http://localhost
```

### Option 2: Local Development

#### 1. Database Setup

```bash
# Using PostgreSQL directly
createdb persona_platform

# Or use Docker for just the database
docker run -d \
  --name persona-db \
  -e POSTGRES_USER=persona \
  -e POSTGRES_PASSWORD=persona_secret \
  -e POSTGRES_DB=persona_platform \
  -p 5432:5432 \
  postgres:16-alpine
```

#### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env

# Run database migrations
npm run migrate

# Seed initial data (creates super admin)
npm run seed

# Start development server
npm run dev
```

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 🔧 Configuration

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `GROQ_API_KEY` | Groq API key for Llama 3 |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | 3001 |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | - |
| `MICROSOFT_CLIENT_ID` | Microsoft OAuth client ID | - |
| `MICROSOFT_CLIENT_SECRET` | Microsoft OAuth client secret | - |

### Setting Up OAuth

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Configure OAuth consent screen
4. Create OAuth 2.0 Client ID credentials
5. Add authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
6. Copy Client ID and Secret to your `.env` file

#### Microsoft OAuth

1. Go to [Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps)
2. Register a new application
3. Add redirect URI: `http://localhost:3001/api/auth/microsoft/callback`
4. Create a client secret
5. Copy Application (client) ID and Secret to your `.env` file

## 📖 API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/google` | Google OAuth |
| GET | `/api/auth/microsoft` | Microsoft OAuth |

### Companies (Super Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies` | List all companies |
| POST | `/api/companies` | Create company |
| GET | `/api/companies/:id` | Get company details |
| PUT | `/api/companies/:id` | Update company |
| PUT | `/api/companies/:id/licenses` | Update licenses |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users |
| POST | `/api/users/invite` | Invite user |
| PUT | `/api/users/:id` | Update user |
| PUT | `/api/users/:id/status` | Activate/deactivate |
| PUT | `/api/users/:id/role` | Change role |

### Questionnaires

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/questionnaires` | List questionnaires |
| POST | `/api/questionnaires` | Create questionnaire |
| GET | `/api/questionnaires/:id` | Get questionnaire |
| PUT | `/api/questionnaires/:id` | Update questionnaire |
| GET | `/api/questionnaires/access/:code` | Public access |
| POST | `/api/questionnaires/:id/responses` | Submit response |
| POST | `/api/questionnaires/:id/generate-personas` | Generate personas |

### Personas

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/personas` | List personas |
| GET | `/api/personas/:id` | Get persona |
| PUT | `/api/personas/:id` | Update persona |
| POST | `/api/personas/find-similar` | Find matching personas |
| POST | `/api/personas/:id/conversations` | Start conversation |
| POST | `/api/personas/conversations/:id/messages` | Send message |

## 🎯 User Roles

### Super Admin
- Manage all companies
- Create/modify companies
- Manage licenses
- Access all platform features

### Company Admin
- Manage company users
- Create questionnaires
- Generate personas
- View all company conversations

### User
- View company personas
- Chat with personas
- Use "Find My Persona"
- Manage own profile

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Multi-tenant data isolation
- Rate limiting on all endpoints
- Input sanitization and XSS protection
- SQL injection prevention via parameterized queries
- Secure password hashing with bcrypt
- CORS protection

## 📊 Database Schema

Key tables:
- `companies` - Multi-tenant organizations
- `users` - All users with role assignments
- `questionnaires` - Survey configurations
- `questionnaire_responses` - User responses
- `personas` - AI-generated personas
- `conversations` - Chat sessions
- `messages` - Chat messages

## 🧪 Demo Data

When running `npm run seed` in development, the following demo accounts are created:

| Email | Password | Role |
|-------|----------|------|
| admin@personaplatform.com | changeme123 | Super Admin |
| demo-admin@democompany.com | demo123 | Company Admin |
| demo-user@democompany.com | demo123 | User |

A demo questionnaire with access code `DEMO12345` and three sample personas (Alex, Jordan, Sam) are also created.

## 🌐 Free Hosting Options

### Backend
- [Railway](https://railway.app) - Free tier with $5 credit/month
- [Render](https://render.com) - Free tier with sleep after inactivity
- [Fly.io](https://fly.io) - Free tier with 3 shared VMs

### Frontend
- [Vercel](https://vercel.com) - Free for personal projects
- [Netlify](https://netlify.com) - Free tier with generous limits
- [Cloudflare Pages](https://pages.cloudflare.com) - Free with unlimited bandwidth

### Database
- [Neon](https://neon.tech) - Free tier with 512MB
- [Supabase](https://supabase.com) - Free tier with 500MB
- [Railway](https://railway.app) - Shared PostgreSQL

### LLM API
- [Groq](https://console.groq.com) - Free tier with generous rate limits (recommended)
- [Together.ai](https://together.ai) - Free tier available
- [Replicate](https://replicate.com) - Pay per use

## 📁 Project Structure

```
persona-platform/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, passport configs
│   │   ├── middleware/      # Auth, security middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic (LLM, email, audit)
│   │   └── index.js         # Server entry point
│   ├── migrations/          # Database migrations
│   ├── scripts/             # Utility scripts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # State management
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   ├── styles/          # Global styles
│   │   └── utils/           # Helper functions
│   └── package.json
├── docker-compose.yml       # Docker orchestration
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Groq](https://groq.com) for fast LLM inference
- [Llama 3](https://llama.meta.com) by Meta for the base model
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Lucide Icons](https://lucide.dev) for icons
