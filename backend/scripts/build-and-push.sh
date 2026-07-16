#!/bin/bash

set -e

USERNAME="antoniomarroffino"
IMAGE_NAME="ghcr.io/$USERNAME/aso-music-backend"

VERSION=${1:-$(date +%Y%m%d-%H%M)}

echo "🚀 Building image: $IMAGE_NAME:$VERSION"

docker build -t $IMAGE_NAME:$VERSION .

echo "📤 Pushing image..."

docker push $IMAGE_NAME:$VERSION

echo "🏷️ Tagging as latest..."

docker tag $IMAGE_NAME:$VERSION $IMAGE_NAME:latest
docker push $IMAGE_NAME:latest

echo "✅ Done!"
echo "Version: $VERSION"