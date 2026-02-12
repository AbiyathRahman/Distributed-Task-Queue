@echo off
REM Docker helper script for Distributed Task Queue (Windows)

setlocal enabledelayedexpansion

if "%1"=="" goto help
if "%1"=="help" goto help

if /i "%1"=="build" goto build
if /i "%1"=="start" goto start
if /i "%1"=="stop" goto stop
if /i "%1"=="restart" goto restart
if /i "%1"=="logs" goto logs
if /i "%1"=="status" goto status
if /i "%1"=="clean" goto clean
if /i "%1"=="shell" goto shell
if /i "%1"=="health" goto health
if /i "%1"=="reset" goto reset

goto help

:build
echo 🔨 Building Docker images...
docker-compose build
echo ✅ Build complete!
goto end

:start
echo 🚀 Starting services...
docker-compose up -d
echo ✅ Services started!
echo 📊 Backend: http://localhost:3000
echo 🔌 WebSocket: ws://localhost:8080
echo 🗄️  MongoDB: localhost:27017
echo 💾 Redis: localhost:6379
goto end

:stop
echo ⏹️  Stopping services...
docker-compose down
echo ✅ Services stopped!
goto end

:restart
echo 🔄 Restarting services...
docker-compose down
docker-compose up -d
echo ✅ Services restarted!
goto end

:logs
if "%2"=="" (
  docker-compose logs -f
) else (
  docker-compose logs -f %2
)
goto end

:status
echo 📋 Service Status:
docker-compose ps
goto end

:clean
echo 🧹 Cleaning up...
docker-compose down -v
docker system prune -f
echo ✅ Cleanup complete!
goto end

:shell
set service=backend-server
if not "%2"=="" set service=%2
echo 🔓 Connecting to %service%...
docker-compose exec %service% sh
goto end

:health
echo 🏥 Checking health...
curl -s http://localhost:3000/health
echo.
goto end

:reset
echo 🔄 Full reset (removes all data)...
docker-compose down -v
docker-compose up -d
echo ✅ System reset started!
goto end

:help
echo Distributed Task Queue - Docker Helper
echo.
echo Usage: docker-helper.bat ^<command^> [options]
echo.
echo Commands:
echo   build                 Build Docker images
echo   start                 Start all services
echo   stop                  Stop all services
echo   restart               Restart all services
echo   logs [service]        View logs (all or specific service)
echo   status                Show running services
echo   shell [service]       Open shell in container
echo   health                Check backend health
echo   clean                 Remove containers and images
echo   reset                 Full reset (WARNING: deletes data)
echo.
echo Examples:
echo   docker-helper.bat build
echo   docker-helper.bat logs backend-worker-1
echo   docker-helper.bat shell mongodb
echo   docker-helper.bat health
echo.

:end
