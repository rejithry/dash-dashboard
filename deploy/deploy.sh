#!/bin/bash

# Dashboard Application - Google Cloud Deployment Script
# Usage: ./deploy.sh

set -e

# Configuration
PROJECT_ID="project-916fffea-4623-4e9d-928"
REGION="us-west1"
REPO="dash-repo"
REGISTRY="us-west1-docker.pkg.dev/${PROJECT_ID}/${REPO}"

# Cloud SQL Configuration
CLOUD_SQL_INSTANCE="dash-mysql"
CLOUD_SQL_CONNECTION="${PROJECT_ID}:${REGION}:${CLOUD_SQL_INSTANCE}"
DB_NAME="dashboard"
DB_USER="dashuser"
DB_PASSWORD="DashP@ss2026"
DB_HOST="35.203.171.87"  # Cloud SQL public IP

echo "=========================================="
echo "Dashboard Application - GCP Deployment"
echo "=========================================="
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Registry: ${REGISTRY}"
echo ""

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Step 1: Build and push backend image
echo "Step 1: Building and pushing backend image..."
docker build -f deploy/backend.Dockerfile -t ${REGISTRY}/dash-backend:latest .
docker push ${REGISTRY}/dash-backend:latest
echo "✓ Backend image pushed"

# Step 2: Deploy backend to Cloud Run
echo ""
echo "Step 2: Deploying backend to Cloud Run..."
gcloud run deploy dash-backend \
  --image=${REGISTRY}/dash-backend:latest \
  --platform=managed \
  --region=${REGION} \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --set-env-vars="NODE_ENV=production" \
  --project=${PROJECT_ID}

# Get backend URL
BACKEND_URL=$(gcloud run services describe dash-backend --region=${REGION} --project=${PROJECT_ID} --format='value(status.url)')
echo "✓ Backend deployed at: ${BACKEND_URL}"

# Step 3: Build and push frontend image with backend URL
echo ""
echo "Step 3: Building and pushing frontend image..."
docker build -f deploy/frontend.Dockerfile \
  --build-arg VITE_API_URL=${BACKEND_URL}/api \
  -t ${REGISTRY}/dash-frontend:latest .
docker push ${REGISTRY}/dash-frontend:latest
echo "✓ Frontend image pushed"

# Step 4: Deploy frontend to Cloud Run
echo ""
echo "Step 4: Deploying frontend to Cloud Run..."
gcloud run deploy dash-frontend \
  --image=${REGISTRY}/dash-frontend:latest \
  --platform=managed \
  --region=${REGION} \
  --allow-unauthenticated \
  --port=8080 \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --project=${PROJECT_ID}

FRONTEND_URL=$(gcloud run services describe dash-frontend --region=${REGION} --project=${PROJECT_ID} --format='value(status.url)')
echo "✓ Frontend deployed at: ${FRONTEND_URL}"

# Step 5: Build and push weather job image
echo ""
echo "Step 5: Building and pushing weather job image..."
docker build -f deploy/weather-job.Dockerfile -t ${REGISTRY}/dash-weather-job:latest .
docker push ${REGISTRY}/dash-weather-job:latest
echo "✓ Weather job image pushed"

# Step 6: Create Cloud Run Job for weather fetcher
echo ""
echo "Step 6: Creating Cloud Run Job for weather fetcher..."
gcloud run jobs create dash-weather-job \
  --image=${REGISTRY}/dash-weather-job:latest \
  --region=${REGION} \
  --set-env-vars="DB_HOST=${DB_HOST},DB_USER=${DB_USER},DB_PASSWORD=${DB_PASSWORD},DB_NAME=${DB_NAME}" \
  --memory=256Mi \
  --cpu=1 \
  --max-retries=3 \
  --task-timeout=60s \
  --project=${PROJECT_ID} 2>/dev/null || \
gcloud run jobs update dash-weather-job \
  --image=${REGISTRY}/dash-weather-job:latest \
  --region=${REGION} \
  --set-env-vars="DB_HOST=${DB_HOST},DB_USER=${DB_USER},DB_PASSWORD=${DB_PASSWORD},DB_NAME=${DB_NAME}" \
  --memory=256Mi \
  --cpu=1 \
  --max-retries=3 \
  --task-timeout=60s \
  --project=${PROJECT_ID}
echo "✓ Weather job created/updated"

# Step 7: Create Cloud Scheduler to trigger job every 30 seconds
echo ""
echo "Step 7: Setting up Cloud Scheduler..."

# Get service account for Cloud Run invoker
SA_EMAIL="${PROJECT_ID}@appspot.gserviceaccount.com"

# Create scheduler job (every 30 seconds = */30 * * * * * but Cloud Scheduler minimum is 1 minute)
# We'll use 1 minute intervals instead
gcloud scheduler jobs create http dash-weather-scheduler \
  --location=${REGION} \
  --schedule="* * * * *" \
  --uri="https://${REGION}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${PROJECT_ID}/jobs/dash-weather-job:run" \
  --http-method=POST \
  --oauth-service-account-email=${SA_EMAIL} \
  --project=${PROJECT_ID} 2>/dev/null || \
gcloud scheduler jobs update http dash-weather-scheduler \
  --location=${REGION} \
  --schedule="* * * * *" \
  --uri="https://${REGION}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${PROJECT_ID}/jobs/dash-weather-job:run" \
  --http-method=POST \
  --oauth-service-account-email=${SA_EMAIL} \
  --project=${PROJECT_ID}
echo "✓ Cloud Scheduler configured (runs every minute)"

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Frontend URL: ${FRONTEND_URL}"
echo "Backend URL: ${BACKEND_URL}"
echo ""
echo "To connect to Cloud SQL from the dashboard:"
echo "  Host: ${DB_HOST}"
echo "  Port: 3306"
echo "  Database: ${DB_NAME}"
echo "  Username: ${DB_USER}"
echo "  Password: ${DB_PASSWORD}"
echo ""
