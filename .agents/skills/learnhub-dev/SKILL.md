# LearnHub Development & Testing

## Architecture
- 4 .NET 8 microservices: Identity.API (:5001), Course.API (:5002), Enrollment.API (:5003), Media.API (:5004)
- Amazon API Gateway HTTP API v2 (emulated locally in Floci) + reverse proxy bridge (:5000 / :5005)
- Next.js 15 frontend (:3000)
- PostgreSQL (3 databases: learnhub_identity, learnhub_courses, learnhub_enrollments)
- AWS S3, AWS SQS & Amazon API Gateway (emulated locally via Floci)

## Build
```bash
# Build all .NET services
dotnet build LearnHub.sln

# Build frontend
cd frontend && npm install && npm run build
```

## Run with Docker
```bash
# Start all services
docker compose up --build

# Rebuild a single service
docker compose up --build <service-name>

# Services: api-gateway, identity-api, course-api, enrollment-api, media-api, frontend, postgres, floci
```

## Key URLs (Docker)
- Frontend: http://localhost:3000
- API Gateway: http://localhost:5000
- Floci (S3 & SQS): http://localhost:4566
- Floci Web UI: http://localhost:4566/_floci/ui (or http://localhost:4500)

## Database Migrations
EF Core migrations run automatically on startup via `context.Database.Migrate()` in each service's Program.cs.

## JWT Authentication
- All services share the same JWT secret configured in each service's appsettings.json
- Tokens include claims: NameIdentifier (user ID), Name, Email, Role
- Roles: Student, Instructor, Admin

## E2E Test Flow
The golden-path test covers the full instructor-to-student lifecycle:
1. Register instructor (POST /api/auth/register with role "Instructor")
2. Create course (POST /api/courses with auth token)
3. Add section (POST /api/courses/{id}/sections)
4. Add lesson (POST /api/courses/{id}/sections/{sectionId}/lessons)
5. Publish course (PUT /api/courses/{id}/publish)
6. Register student (POST /api/auth/register with role "Student")
7. Browse courses (GET /api/courses)
8. View course detail (GET /api/courses/{id})
9. Enroll (POST /api/enrollments with courseId)
10. Verify enrollment (GET /api/enrollments/my)

## Known Configuration Notes
- S3 URLs: Media.API uses `AWS:PublicServiceURL` (http://localhost:4566) for browser-facing URLs vs `AWS:ServiceURL` (http://floci:4566) for SDK calls
- EventBus: AWS SQS client for asynchronous event publishing and polling subscription (pointing to Floci locally)
- CORS: Wide open for local dev (AllowAnyOrigin)
- Frontend env: `NEXT_PUBLIC_API_URL` for browser requests, `API_URL` for SSR
