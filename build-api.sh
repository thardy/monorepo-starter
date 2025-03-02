#!/bin/bash
echo "Building API Dockerfile.dev..."
docker build -f apps/api/Dockerfile.dev -t $IMAGE .