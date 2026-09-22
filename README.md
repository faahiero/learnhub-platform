# LearnHub - Online Learning Platform

A modern Udemy-like learning platform built with **microservices architecture** using .NET 8, Next.js, Docker, and AWS (emulated locally via Floci).

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Frontend   │────▶│  API Gateway │────▶│  Identity API   │
│  (Next.js)   │     │ (AWS Floci)  │     │  (Auth / JWT)   │
│  Port: 3000  │     │ Port: 5000   │     │  Port: 5001     │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
                    ┌──────┴───────┐
                    │              │
              ┌─────▼─────┐ ┌─────▼──────┐ ┌──────────────┐
              │ Course API │ │ Enrollment │ │  Media API   │
              │ Port: 5002 │ │    API     │ │  Port: 5004  │
              └─────┬──────┘ │ Port: 5003 │ └──────┬───────┘
                    │        └─────┬──────┘        │
              ┌─────▼──────────────▼───────────────▼──────┐
              │              PostgreSQL                     │
              │  (identity_db / courses_db / enrollments_db)│
              └────────────────────────────────────────────┘
              ┌────────────────────────────────────────────┐
              │          AWS (via Floci Emulator)          │
              │   (API Gateway, S3 Storage, SQS Event Bus) │
              └────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React, TypeScript, Tailwind CSS |
| **API Gateway** | Amazon API Gateway (HTTP API v2, emulado via Floci) + Bridge local |
| **Microservices** | .NET 8, ASP.NET Core, Entity Framework Core |
| **Database** | PostgreSQL 16 |
| **Cloud Services** | AWS (API Gateway, S3 & SQS emulados localmente via Floci) |
| **Containerization** | Docker, Docker Compose |

## Microservices

### Identity Service (Port 5001)
- User registration and login
- JWT token generation and validation
- Profile management
- Role-based access (Student, Instructor, Admin)

### Course Service (Port 5002)
- Course CRUD operations
- Sections and lessons management
- Course publishing workflow
- Search and filtering

### Enrollment Service (Port 5003)
- Student enrollment
- Progress tracking
- Course reviews and ratings

### Media Service (Port 5004)
- File uploads (images, videos, documents)
- AWS S3 storage (emulated locally via Floci)
- Support for multiple file types

### API Gateway (Port 5000 / 5005)
- Amazon API Gateway HTTP API v2 (emulated locally in Floci)
- Auto-provisioned routing to microservices (`/api/auth`, `/api/courses`, `/api/enrollments`, `/api/media`)
- Native lightweight reverse proxy bridge for localhost compatibility

## Getting Started

### Prerequisites
- Docker and Docker Compose
- (Optional) .NET 8 SDK for local development
- (Optional) Node.js 22+ for frontend development

### Quick Start with Docker

```bash
# Clone the repository
git clone <repo-url>
cd learnhub-platform

# Start all services
docker compose up --build

# Access the application
# Frontend:                  http://localhost:3000
# API Gateway Bridge:        http://localhost:5000 (ou 5005 no macOS com AirPlay)
# Floci (API Gateway, S3, SQS): http://localhost:4566
# Floci Web UI:              http://localhost:4500 (ou http://localhost:4566/_floci/ui)
```

### Local Development

**Backend (.NET):**
```bash
# Restore and build
dotnet restore
dotnet build

# Run individual services
cd src/Services/Identity/Identity.API && dotnet run
cd src/Services/Course/Course.API && dotnet run
cd src/Services/Enrollment/Enrollment.API && dotnet run
cd src/Services/Media/Media.API && dotnet run
```

**Frontend (Next.js):**
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Login and get JWT token |
| GET | `/profile` | Get current user profile |
| PUT | `/profile` | Update profile |

### Courses (`/api/courses`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List published courses |
| GET | `/:id` | Get course details |
| POST | `/` | Create course (Instructor) |
| PUT | `/:id` | Update course (Instructor) |
| POST | `/:id/publish` | Publish course |
| POST | `/:id/sections` | Add section |
| POST | `/:id/sections/:sId/lessons` | Add lesson |

### Enrollments (`/api/enrollments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Enroll in a course |
| GET | `/my-enrollments` | Get user enrollments |
| POST | `/:id/progress` | Update lesson progress |
| POST | `/reviews` | Submit a review |
| GET | `/reviews/:courseId` | Get course reviews |

### Media (`/api/media`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload a file |
| POST | `/upload-multiple` | Upload multiple files |

## Project Structure

```
learnhub-platform/
├── docker-compose.yml
├── LearnHub.sln
├── src/
│   ├── BuildingBlocks/
│   │   └── Common/              # Shared library (events, extensions)
│   ├── Gateway/
│   │   └── ApiGateway/          # AWS API Gateway Bridge (Node.js)
│   └── Services/
│       ├── Identity/Identity.API/  # Auth microservice
│       ├── Course/Course.API/      # Course microservice
│       ├── Enrollment/Enrollment.API/ # Enrollment microservice
│       └── Media/Media.API/        # Media microservice
├── frontend/                    # Next.js frontend
│   ├── src/
│   │   ├── app/                 # App router pages
│   │   ├── components/          # Reusable components
│   │   ├── contexts/            # React contexts
│   │   └── lib/                 # API client, types
│   └── Dockerfile
└── infrastructure/
    ├── floci/                   # Floci (S3 & SQS) init scripts
    └── postgres/                # PostgreSQL init scripts
```

## Environment Variables

The services are configured via environment variables in `docker-compose.yml`. Key variables:

- `ConnectionStrings__DefaultConnection` - PostgreSQL connection string
- `Jwt__Secret` - JWT signing key (shared across services)
- `AWS__ServiceURL` - AWS endpoint (points to Floci locally: http://floci:4566)
- `AWS__BucketName` - S3 bucket name (default: learnhub-media)
- `AWS__PublicServiceURL` - Publicly accessible URL for uploaded media files
- `NEXT_PUBLIC_API_BROWSER_URL` - API Gateway URL for the frontend
