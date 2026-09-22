#!/bin/bash
echo "Initializing Floci resources (S3, SQS & API Gateway)..."

ENDPOINT="http://localhost:4566"

# Create S3 bucket for media uploads
if command -v awslocal &> /dev/null; then
  awslocal s3 mb s3://learnhub-media 2>/dev/null || true
  awslocal s3api put-bucket-cors --bucket learnhub-media --cors-configuration '{
    "CORSRules": [
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag", "Content-Length", "Content-Range", "Accept-Ranges"],
        "MaxAgeSeconds": 3000
      }
    ]
  }' 2>/dev/null || true
  awslocal sqs create-queue --queue-name course-events 2>/dev/null || true
  awslocal sqs create-queue --queue-name enrollment-events 2>/dev/null || true
  awslocal sqs create-queue --queue-name media-events 2>/dev/null || true
  
  # Provision Amazon API Gateway v2 (HTTP API)
  EXISTING_API_ID=$(awslocal apigatewayv2 get-apis --query "Items[?Name=='learnhub-gateway'].ApiId" --output text 2>/dev/null || true)
  if [ -z "$EXISTING_API_ID" ] || [ "$EXISTING_API_ID" = "None" ]; then
    echo "Creating Amazon API Gateway HTTP API..."
    API_ID=$(awslocal apigatewayv2 create-api \
      --name "learnhub-gateway" \
      --protocol-type HTTP \
      --cors-configuration "AllowOrigins=*,AllowMethods=*,AllowHeaders=*" \
      --query "ApiId" \
      --output text)

    # Integrations
    AUTH_INT=$(awslocal apigatewayv2 create-integration \
      --api-id "$API_ID" \
      --integration-type HTTP_PROXY \
      --integration-uri "http://identity-api:80/api/auth/{proxy}" \
      --integration-method ANY \
      --payload-format-version "1.0" \
      --query "IntegrationId" \
      --output text)

    COURSES_INT=$(awslocal apigatewayv2 create-integration \
      --api-id "$API_ID" \
      --integration-type HTTP_PROXY \
      --integration-uri "http://course-api:80/api/courses/{proxy}" \
      --integration-method ANY \
      --payload-format-version "1.0" \
      --query "IntegrationId" \
      --output text)

    ENROLLMENTS_INT=$(awslocal apigatewayv2 create-integration \
      --api-id "$API_ID" \
      --integration-type HTTP_PROXY \
      --integration-uri "http://enrollment-api:80/api/enrollments/{proxy}" \
      --integration-method ANY \
      --payload-format-version "1.0" \
      --query "IntegrationId" \
      --output text)

    MEDIA_INT=$(awslocal apigatewayv2 create-integration \
      --api-id "$API_ID" \
      --integration-type HTTP_PROXY \
      --integration-uri "http://media-api:80/api/media/{proxy}" \
      --integration-method ANY \
      --payload-format-version "1.0" \
      --query "IntegrationId" \
      --output text)

    # Routes
    awslocal apigatewayv2 create-route --api-id "$API_ID" --route-key "ANY /api/auth" --target "integrations/$AUTH_INT"
    awslocal apigatewayv2 create-route --api-id "$API_ID" --route-key "ANY /api/auth/{proxy+}" --target "integrations/$AUTH_INT"

    awslocal apigatewayv2 create-route --api-id "$API_ID" --route-key "ANY /api/courses" --target "integrations/$COURSES_INT"
    awslocal apigatewayv2 create-route --api-id "$API_ID" --route-key "ANY /api/courses/{proxy+}" --target "integrations/$COURSES_INT"

    awslocal apigatewayv2 create-route --api-id "$API_ID" --route-key "ANY /api/enrollments" --target "integrations/$ENROLLMENTS_INT"
    awslocal apigatewayv2 create-route --api-id "$API_ID" --route-key "ANY /api/enrollments/{proxy+}" --target "integrations/$ENROLLMENTS_INT"

    awslocal apigatewayv2 create-route --api-id "$API_ID" --route-key "ANY /api/media" --target "integrations/$MEDIA_INT"
    awslocal apigatewayv2 create-route --api-id "$API_ID" --route-key "ANY /api/media/{proxy+}" --target "integrations/$MEDIA_INT"

    # Stage
    awslocal apigatewayv2 create-stage \
      --api-id "$API_ID" \
      --stage-name '$default' \
      --auto-deploy
    
    echo "Amazon API Gateway created with ID: $API_ID"
  else
    API_ID="$EXISTING_API_ID"
    echo "Amazon API Gateway already exists with ID: $API_ID"
  fi

  # Provision API Gateway v1 (REST API) so it appears in Floci UI (which tracks v1 REST APIs)
  EXISTING_REST_API=$(awslocal apigateway get-rest-apis --query "items[?name=='learnhub-gateway'].id" --output text 2>/dev/null || true)
  if [ -z "$EXISTING_REST_API" ] || [ "$EXISTING_REST_API" = "None" ]; then
    awslocal apigateway create-rest-api --name "learnhub-gateway" --description "LearnHub Platform API Gateway" >/dev/null 2>&1 || true
  fi

  echo "Floci initialization complete!"
  echo "Endpoint: http://${API_ID}.execute-api.localhost.floci.io:4566"
fi
