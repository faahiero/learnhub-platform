# LearnHub - Online Learning Platform

A modern Udemy-like learning platform built with **microservices architecture** using .NET 8, Next.js, Docker, and LocalStack.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Frontend   │────▶│  API Gateway │────▶│  Identity API   │
│  (Next.js)   │     │   (Ocelot)   │     │  (Auth / JWT)   │
│  Port: 3000  │     │  Port: 5000  │     │  Port: 5001     │
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
              ┌────────────────┐  ┌────────────────────────┐
              │   RabbitMQ     │  │     LocalStack (S3)    │
              │  (Event Bus)   │  │   (Media Storage)      │
              └────────────────┘  └────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React, TypeScript, Tailwind CSS |
| **API Gateway** | .NET 8, Ocelot |
| **Microservices** | .NET 8, ASP.NET Core, Entity Framework Core |
| **Database** | PostgreSQL 16 |
| **Message Broker** | RabbitMQ |
| **Cloud Services** | LocalStack (S3, SQS) |
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
- S3 storage via LocalStack
- Support for multiple file types

### API Gateway (Port 5000)
- Request routing to microservices
- Single entry point for the frontend

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
# Frontend:    http://localhost:3000
# API Gateway: http://localhost:5000
# RabbitMQ:    http://localhost:15672 (guest/guest)
# LocalStack:  http://localhost:4566
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
cd src/Gateway/ApiGateway && dotnet run
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
│   │   └── ApiGateway/          # Ocelot API Gateway
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
    ├── localstack/              # LocalStack init scripts
    └── postgres/                # PostgreSQL init scripts
```

## Environment Variables

The services are configured via environment variables in `docker-compose.yml`. Key variables:

- `ConnectionStrings__DefaultConnection` - PostgreSQL connection string
- `Jwt__Secret` - JWT signing key (shared across services)
- `RabbitMQ__Host` - RabbitMQ hostname
- `AWS__ServiceURL` - LocalStack endpoint
- `NEXT_PUBLIC_API_BROWSER_URL` - API Gateway URL for the frontend
