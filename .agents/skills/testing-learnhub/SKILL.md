# Testing LearnHub Platform

## Running the Platform

```bash
docker compose up --build -d
```

Wait for all 9 containers to be healthy before testing.

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| API Gateway | 5000 | http://localhost:5000 |
| Identity API | 5001 | http://localhost:5001 |
| Course API | 5002 | http://localhost:5002 |
| Enrollment API | 5003 | http://localhost:5003 |
| Media API | 5004 | http://localhost:5004 |
| RabbitMQ UI | 15672 | http://localhost:15672 (guest/guest) |
| LocalStack | 4566 | http://localhost:4566 |

## Test Account Registration

Register via UI at http://localhost:3000/register or via API:

```bash
# Register instructor
curl -s http://localhost:5000/api/auth/register -H "Content-Type: application/json" \
  -d '{"fullName":"Test Instructor","email":"instructor@test.com","password":"Test1234!","role":"Instructor"}'

# Register student
curl -s http://localhost:5000/api/auth/register -H "Content-Type: application/json" \
  -d '{"fullName":"Test Student","email":"student@test.com","password":"Test1234!","role":"Student"}'
```

## Key API Endpoints

### Authentication
```bash
# Login (returns JWT token)
curl -s http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Test1234!"}' | jq -r '.token'
```

### Course Management (Instructor)
```bash
# Publish course (NOTE: use POST, not PUT)
curl -s -X POST http://localhost:5000/api/courses/{courseId}/publish \
  -H "Authorization: Bearer $TOKEN"

# Get course with lesson IDs
curl -s http://localhost:5000/api/courses/{courseId} | jq '.sections[].lessons[].id'
```

### Progress Tracking (No UI — API only)

There is no UI for marking lessons complete. Use the API directly:

```bash
# Mark lesson complete
curl -s -X POST http://localhost:5000/api/enrollments/{enrollmentId}/progress \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lessonId": "<lesson-guid>", "isCompleted": true, "watchedSeconds": 600}'

# Un-complete a lesson
curl -s -X POST http://localhost:5000/api/enrollments/{enrollmentId}/progress \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lessonId": "<lesson-guid>", "isCompleted": false, "watchedSeconds": 300}'

# Get enrollments
curl -s http://localhost:5000/api/enrollments/my-enrollments \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

## E2E Test Flow

1. Register instructor → Create course → Add section + lessons → Publish
2. Register student → Browse courses → Enroll
3. Verify dashboard at http://localhost:3000/dashboard shows enrollment
4. Use curl to update lesson progress (see above)
5. Refresh dashboard to verify progress bar and status badge update
6. Status transitions: Active (blue) → Completed (green) at 100% → Active (blue) when un-completing

## Creating Admin Users

The API only allows Student/Instructor roles. To create an Admin:
1. Register a user normally
2. Update role directly in the database:
```bash
docker exec learnhub-platform-postgres-1 psql -U postgres -d learnhub_identity \
  -c "UPDATE \"Users\" SET \"Role\" = 'Admin' WHERE \"Email\" = 'admin@test.com';"
```

## Database Names

| Service | Database |
|---------|----------|
| Identity | learnhub_identity |
| Courses | learnhub_courses |
| Enrollments | learnhub_enrollments |
