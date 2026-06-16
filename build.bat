@echo off
echo Building React Frontend...
cd frontend
call npm install
call npm run build
cd ..

echo Copying build to backend...
if exist "backend\static" rmdir /s /q "backend\static"
mkdir "backend\static"
xcopy /E /I /Y "frontend\dist\*" "backend\static\"

echo Build complete! You can now run: docker-compose -f docker-compose.prod.yml up -d --build
