$Host.UI.RawUI.WindowTitle = "Food Ordering - Backend Startup"

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BackendPath = Join-Path $ProjectRoot "backend"
$AdminPath = Join-Path $ProjectRoot "admin"
$BackendPort = 8080
$AdminPort = 3000

function Write-Status {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host " $Message" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

function Stop-ExistingServices {
    Write-Status "Stopping Existing Services"
    
    Write-Host "Stopping Java processes (Spring Boot)..." -ForegroundColor Yellow
    Get-Process -Name "java", "javaw" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    Write-Host "Stopping Node.js processes (Vue Admin)..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    Write-Host "Stopping conflicting Docker containers..." -ForegroundColor Yellow
    docker stop library-mysql library-redis 2>$null
    docker rm library-mysql library-redis 2>$null
    
    Write-Host "Waiting for ports to be released..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    Write-Host "[OK] Existing services stopped" -ForegroundColor Green
}

function Start-DockerServices {
    Write-Status "Starting Docker Services (MySQL, Redis, RabbitMQ)"
    
    if (-not (Test-Command "docker")) {
        Write-Host "[ERROR] Docker is not installed or not in PATH" -ForegroundColor Red
        exit 1
    }
    
    $ComposeFile = Join-Path $ProjectRoot "docker-compose.yml"
    
    Write-Host "Stopping existing Docker containers..." -ForegroundColor Yellow
    docker-compose -f $ComposeFile down 2>$null
    
    Write-Host "Starting Docker containers..." -ForegroundColor Yellow
    docker-compose -f $ComposeFile up -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to start Docker services" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "[OK] Docker services started successfully" -ForegroundColor Green
    Write-Host "  - MySQL: localhost:3306" -ForegroundColor Gray
    Write-Host "  - Redis: localhost:6379" -ForegroundColor Gray
    Write-Host "  - RabbitMQ: localhost:5672 (Management: localhost:15672)" -ForegroundColor Gray
}

function Start-Backend {
    Write-Status "Starting Spring Boot Backend"
    
    Set-Location $BackendPath
    
    if (Test-Path "mvnw") {
        Write-Host "Using Maven Wrapper..." -ForegroundColor Yellow
        $mavenCmd = ".\mvnw.cmd"
    } elseif (Test-Command "mvn") {
        Write-Host "Using system Maven..." -ForegroundColor Yellow
        $mavenCmd = "mvn"
    } else {
        Write-Host "[ERROR] Maven not found. Please install Maven or use Maven Wrapper." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Starting backend on http://localhost:$BackendPort" -ForegroundColor Yellow
    
    Start-Process -FilePath "powershell" -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$BackendPath'; $mavenCmd spring-boot:run"
    ) -WindowStyle Normal
    
    Write-Host "[OK] Backend starting in new window" -ForegroundColor Green
}

function Start-Admin {
    Write-Status "Starting Vue Admin Frontend"
    
    Set-Location $AdminPath
    
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "Starting admin frontend on http://localhost:$AdminPort" -ForegroundColor Yellow
    
    Start-Process -FilePath "powershell" -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$AdminPath'; npm run dev -- --port $AdminPort"
    ) -WindowStyle Normal
    
    Write-Host "[OK] Admin frontend starting in new window" -ForegroundColor Green
}

Write-Host @"

  _____                 _      ____                   _             
 |  ___|_ _ _ __  _ __ | | ___/ ___| ___   ___  _ __ | |_ _ __ __ _ 
 | |_ / _` | '_ \| '_ \| |/ _ \___ \/ _ \ / _ \| '_ \| __| '__/ _` |
 |  _| (_| | | | | | | | |  __/___) | (_) | (_) | | | | |_| | | (_| |
 |_|  \__,_|_| |_|_| |_|_|\___|____/ \___/ \___/|_| |_|\__|_|  \__,_|
                                                                      
                    One-Click Backend Startup Script
"@ -ForegroundColor Magenta

Write-Host "Project Root: $ProjectRoot" -ForegroundColor Gray
Write-Host "Backend: $BackendPath" -ForegroundColor Gray
Write-Host "Admin: $AdminPath" -ForegroundColor Gray

Stop-ExistingServices
Start-DockerServices
Start-Backend
Start-Admin

Write-Status "All Services Started!"

Write-Host "Services running:" -ForegroundColor Green
Write-Host "  [Docker]  MySQL      -> localhost:3306" -ForegroundColor White
Write-Host "  [Docker]  Redis      -> localhost:6379" -ForegroundColor White
Write-Host "  [Docker]  RabbitMQ   -> localhost:5672 (Management: localhost:15672)" -ForegroundColor White
Write-Host "  [Backend] Spring Boot -> http://localhost:$BackendPort" -ForegroundColor White
Write-Host "  [Frontend] Vue Admin  -> http://localhost:$AdminPort" -ForegroundColor White

Write-Host "`nPress any key to exit this window (services will continue running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
