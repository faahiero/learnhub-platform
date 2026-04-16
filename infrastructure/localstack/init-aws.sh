#!/bin/bash
echo "Initializing LocalStack resources..."

# Create S3 bucket for media uploads
awslocal s3 mb s3://learnhub-media

# Create SQS queues for event processing
awslocal sqs create-queue --queue-name course-events
awslocal sqs create-queue --queue-name enrollment-events
awslocal sqs create-queue --queue-name media-events

echo "LocalStack initialization complete!"
echo "S3 Buckets:"
awslocal s3 ls
echo "SQS Queues:"
awslocal sqs list-queues
