#!/bin/bash
echo "Building React Frontend..."
cd frontend || exit
npm install
npm run build
cd ..

echo "Copying build to backend..."
rm -rf backend/static
mkdir -p backend/static
cp -r frontend/dist/* backend/static/

echo "Build complete! You can now run: docker-compose -f docker-compose.prod.yml up -d --build"
