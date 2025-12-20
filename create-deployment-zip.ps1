# Azure Functions Deployment ZIP Creator (PowerShell)
# For Windows users

Write-Host "🚀 Creating Azure Functions Deployment ZIP..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Navigate to backend directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Step 2: Clean previous builds
Write-Host "📦 Cleaning previous builds..." -ForegroundColor Yellow
npm run clean 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "No clean script found, continuing..." -ForegroundColor Gray
}

# Step 3: Install dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
npm install

# Step 4: Build TypeScript
Write-Host "🔨 Building TypeScript..." -ForegroundColor Yellow
npm run build

# Step 5: Install production dependencies
Write-Host "📦 Installing production dependencies..." -ForegroundColor Yellow
npm install --production

# Step 6: Create ZIP file
Write-Host "📦 Creating deployment ZIP..." -ForegroundColor Yellow

$ZipName = "deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"

# Remove existing ZIP if present
if (Test-Path $ZipName) {
    Remove-Item $ZipName
}

# Create ZIP excluding unnecessary files
Compress-Archive -Path * -DestinationPath $ZipName -Force `
    -Exclude @(
        "*.ts",
        "*.tsbuildinfo",
        ".git",
        ".vscode",
        "local.settings.json",
        "*.js.map",
        "__azurite_db*.json",
        "__blobstorage__",
        "__queuestorage__",
        "*.log",
        ".env*",
        "tsconfig.json",
        ".github",
        "*.sh",
        "*.ps1",
        "deployment-*.zip",
        "*.md",
        "test",
        "tests",
        "__tests__",
        "*.test.js",
        "*.spec.js"
    )

$FileSize = (Get-Item $ZipName).Length / 1MB

Write-Host ""
Write-Host "✅ Deployment ZIP created successfully!" -ForegroundColor Green
Write-Host "📁 File: $ZipName" -ForegroundColor Green
Write-Host "📊 Size: $([math]::Round($FileSize, 2)) MB" -ForegroundColor Green
Write-Host ""
Write-Host "📤 Ready to upload to Azure Portal!" -ForegroundColor Cyan
Write-Host "   Azure Portal → Function App → Deployment Center → Manual deployment" -ForegroundColor Gray
