@echo off
chcp 65001 >nul
title Food Ordering - Backend Startup

setlocal enabledelayedexpansion

set "ProjectRoot=%~dp0.."
set "BackendPath=%ProjectRoot%\backend"
set "AdminPath=%ProjectRoot%\admin"
set "ComposeFile=%ProjectRoot%\docker-compose.yml"
set "BackendPort=8080"
set "AdminPort=3000"

echo.
echo   _____                 _      ____                   _             
echo  ^|  ___^|_ _ _ __  _ __ ^| ^| ___/ ___^| ___   ___  _ __ ^| ^|_ _ __ __ _ 
echo  ^| ^|_ / _` ^| '_ \^| '_ \^| ^|/ _ \___ \/ _ \ / _ \^| '_ \^| __^| '__/ _` ^|
echo  ^|  _^| (_^| ^| ^| ^| ^| ^| ^| ^| ^|  __/___^) ^| (_) ^| (_) ^| ^| ^| ^| ^|_^| ^| ^| (_^| ^|
echo  ^|_^|  \__,_^|_^| ^|_^|_^| ^|_^|\___^|____/ \___/ \___/^|_^| ^|_^|\__^|_^|  \__,_^|
echo.                                                                      
echo                   One-Click Backend Startup Script
echo.

echo [INFO] Project Root: %ProjectRoot%
echo [INFO] Backend: %BackendPath%
echo [INFO] Admin: %AdminPath%
echo.

echo ========================================
echo  Stopping Existing Services
echo ========================================
echo.

echo [INFO] Stopping Java processes (Spring Boot)...
taskkill /F /IM java.exe >nul 2>&1
taskkill /F /IM javaw.exe >nul 2>&1

echo [INFO] Stopping Node.js processes (Vue Admin)...
taskkill /F /IM node.exe >nul 2>&1

echo [INFO] Stopping conflicting Docker containers...
docker stop food_ordering_mysql food_ordering_redis food_ordering_rabbitmq 2>nul
docker rm food_ordering_mysql food_ordering_redis food_ordering_rabbitmq 2>nul

echo [INFO] Waiting for ports to be released...
timeout /t 3 /nobreak >nul

echo [OK] Existing services stopped
echo.

echo ========================================
echo  Starting Docker Services (MySQL, Redis, RabbitMQ)
echo ========================================
echo.

where docker >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not in PATH
    exit /b 1
)

echo [INFO] Stopping existing Docker containers...
docker-compose -f "%ComposeFile%" down >nul 2>&1

echo [INFO] Starting Docker containers...
docker-compose -f "%ComposeFile%" up -d
if errorlevel 1 (
    echo [ERROR] Failed to start Docker services
    echo [INFO] Please check if ports 23306, 26379, 25672, 25673 are available
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo [OK] Docker services started successfully
echo   - MySQL: localhost:23306
echo   - Redis: localhost:26379
echo   - RabbitMQ: localhost:25672 (Management: localhost:25673)
echo.

echo ========================================
echo  Starting Spring Boot Backend
echo ========================================
echo.

cd /d "%BackendPath%"

if exist "mvnw.cmd" (
    echo [INFO] Using Maven Wrapper...
    set "MavenCmd=mvnw.cmd"
) else (
    where mvn >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Maven not found. Please install Maven or use Maven Wrapper.
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
    echo [INFO] Using system Maven...
    set "MavenCmd=mvn"
)

echo [INFO] Starting backend on http://localhost:%BackendPort%
start "Food Ordering - Backend" cmd /k "cd /d "%BackendPath%" && !MavenCmd! spring-boot:run"
echo [OK] Backend starting in new window
echo.

echo ========================================
echo  Starting Vue Admin Frontend
echo ========================================
echo.

cd /d "%AdminPath%"

if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
)

echo [INFO] Starting admin frontend on http://localhost:%AdminPort%
start "Food Ordering - Admin" cmd /k "cd /d "%AdminPath%" && npm run dev -- --port %AdminPort%"
echo [OK] Admin frontend starting in new window
echo.

echo ========================================
echo  All Services Started!
echo ========================================
echo.
echo Services running:
echo   [Docker]  MySQL      -^> localhost:23306
echo   [Docker]  Redis      -^> localhost:26379
echo   [Docker]  RabbitMQ   -^> localhost:25672 (Management: localhost:25673)
echo   [Backend] Spring Boot -^> http://localhost:%BackendPort%
echo   [Frontend] Vue Admin  -^> http://localhost:%AdminPort%
echo.
echo This window will stay open. Press Ctrl+C or close it manually when you want to stop monitoring.
echo.
:keep_open
timeout /t 60 >nul
goto keep_open
