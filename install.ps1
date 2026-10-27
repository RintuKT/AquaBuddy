# AquaBuddy - Windows One-Line PowerShell Installer
# Run via: irm https://raw.githubusercontent.com/RintuKT/AquaBuddy/main/install.ps1 | iex

$ErrorActionPreference = 'Stop'

Write-Host "💧 ==========================================" -ForegroundColor Cyan
Write-Host "    AquaBuddy - Desktop Hydration Reminder   " -ForegroundColor Cyan
Write-Host "    Windows Installer (x64)                 " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Stop any currently running AquaBuddy instances to prevent file lock
Write-Host "🔍 1. Stopping any active AquaBuddy processes..." -ForegroundColor Yellow
Get-Process -Name "AquaBuddy" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# 2. Locate newest release from GitHub
Write-Host "🔍 2. Finding newest AquaBuddy release from GitHub..." -ForegroundColor Yellow

$latestTag = ""
try {
    $response = Invoke-WebRequest -Uri "https://github.com/RintuKT/AquaBuddy/releases/latest" -MaximumRedirection 0 -ErrorAction SilentlyContinue
    $location = $response.Headers["Location"]
    if ($location) {
        $latestTag = ($location -split "/")[-1]
    }
} catch {
    if ($_.Exception.Response.Headers["Location"]) {
        $latestTag = ($_.Exception.Response.Headers["Location"] -split "/")[-1]
    }
}

if (-not $latestTag -or $latestTag -eq "latest") {
    try {
        $apiRelease = Invoke-RestMethod -Uri "https://api.github.com/repos/RintuKT/AquaBuddy/releases/latest" -Headers @{"User-Agent"="PowerShell"}
        $latestTag = $apiRelease.tag_name
    } catch {
        $latestTag = "v1.0.9"
    }
}

$versionNum = $latestTag.TrimStart("v")
$downloadUrl = "https://github.com/RintuKT/AquaBuddy/releases/download/$latestTag/AquaBuddy.Setup.$versionNum.exe"
$fallbackUrl = "https://github.com/RintuKT/AquaBuddy/releases/download/$latestTag/AquaBuddy-Setup-$versionNum.exe"

$tempExe = Join-Path $env:TEMP "AquaBuddySetup-$versionNum.exe"

Write-Host "📦 3. Downloading AquaBuddy $latestTag for Windows..." -ForegroundColor Green
Write-Host "    URL: $downloadUrl"

$downloadSuccess = $false
try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $tempExe -UseBasicParsing
    $downloadSuccess = $true
} catch {
    try {
        Write-Host "    Trying alternate naming convention..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $fallbackUrl -OutFile $tempExe -UseBasicParsing
        $downloadSuccess = $true
    } catch {
        # Fallback to latest available exe asset from GitHub Releases API
        Write-Host "    Looking for latest available Windows release..." -ForegroundColor Yellow
        $releases = Invoke-RestMethod -Uri "https://api.github.com/repos/RintuKT/AquaBuddy/releases" -Headers @{"User-Agent"="PowerShell"}
        foreach ($rel in $releases) {
            $exeAsset = $rel.assets | Where-Object { $_.name -like "*.exe" } | Select-Object -First 1
            if ($exeAsset) {
                Write-Host "    Downloading: $($exeAsset.browser_download_url)" -ForegroundColor Green
                Invoke-WebRequest -Uri $exeAsset.browser_download_url -OutFile $tempExe -UseBasicParsing
                $downloadSuccess = $true
                break
            }
        }
    }
}

if (-not $downloadSuccess -or -not (Test-Path $tempExe)) {
    Write-Host "❌ Failed to download AquaBuddy for Windows. Please check your network." -ForegroundColor Red
    exit 1
}

Write-Host "🚀 4. Launching AquaBuddy installer..." -ForegroundColor Green
Start-Process -FilePath $tempExe

Write-Host ""
Write-Host "✨ ==========================================" -ForegroundColor Cyan
Write-Host "    🎉 AquaBuddy $latestTag installed!        " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
