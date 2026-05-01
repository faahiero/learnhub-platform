# LearnHub Development & Testing

## Architecture
- 5 .NET 8 microservices: Identity.API (:5001), Course.API (:5002), Enrollment.API (:5003), Media.API (:5004), ApiGateway (:5000)
- Next.js 15 frontend (:3000)
- PostgreSQL (3 databases: learnhub_identity, learnhub_courses, learnhub_enrollments)
- RabbitMQ (event bus)
- LocalStack (S3 for media storage)

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

# Services: api-gateway, identity-api, course-api, enrollment-api, media-api, frontend, postgres, rabbitmq, localstack
```

## Key URLs (Docker)
- Frontend: http://localhost:3000
- API Gateway: http://localhost:5000
- RabbitMQ Management: http://localhost:15672 (guest/guest)
- LocalStack S3: http://localhost:4566

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
- S3 URLs: Media.API uses `AWS:PublicServiceURL` (http://localhost:4566) for browser-facing URLs vs `AWS:ServiceURL` (http://localstack:4566) for SDK calls
- EventBus: Singleton with lock-based thread safety for BasicPublish
- CORS: Wide open for local dev (AllowAnyOrigin)
- Frontend env: `NEXT_PUBLIC_API_URL` for browser requests, `API_URL` for SSR
