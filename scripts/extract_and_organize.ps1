# Script to extract all test centre zip files and organize them
# Run this from PowerShell: .\extract_and_organize.ps1

$downloadsPath = "$env:USERPROFILE\Downloads\Free test Routes"
$scriptsPath = "C:\Users\Nathaniel\Documents\DTEwithphonelocationontest\scripts"

Write-Host ""
Write-Host "Extracting and organizing test centre routes..." -ForegroundColor Cyan
Write-Host ("=" * 60)

# Check if Downloads folder exists
if (-not (Test-Path $downloadsPath)) {
    Write-Host "Error: Downloads folder not found at $downloadsPath" -ForegroundColor Red
    exit 1
}

# Get all zip files
$zipFiles = Get-ChildItem -Path $downloadsPath -Filter "*.zip"
$totalZips = $zipFiles.Count

Write-Host ""
Write-Host "Found $totalZips zip files to extract" -ForegroundColor Green
Write-Host ""

$extracted = 0
$skipped = 0
$failed = 0

foreach ($zipFile in $zipFiles) {
    $extracted++
    $zipName = $zipFile.BaseName
    $destFolder = Join-Path $scriptsPath $zipName

    Write-Host "[$extracted/$totalZips] Extracting: $zipName" -ForegroundColor Yellow

    try {
        # Check if folder already exists
        if (Test-Path $destFolder) {
            Write-Host "    Folder already exists, skipping..." -ForegroundColor Gray
            $skipped++
            continue
        }

        # Extract directly to scripts folder
        Expand-Archive -Path $zipFile.FullName -DestinationPath $scriptsPath -Force

        Write-Host "    Extracted successfully" -ForegroundColor Green

    } catch {
        Write-Host "    Failed: $_" -ForegroundColor Red
        $failed++
    }

    # Progress update every 50 files
    if ($extracted % 50 -eq 0) {
        Write-Host ""
        Write-Host "Progress: $extracted/$totalZips processed" -ForegroundColor Cyan
        Write-Host ""
    }
}

Write-Host ""
Write-Host ("=" * 60)
Write-Host "EXTRACTION SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 60)
Write-Host "Total zip files: $totalZips"
Write-Host "Successfully extracted: $($extracted - $skipped - $failed)" -ForegroundColor Green
Write-Host "Skipped (already exists): $skipped" -ForegroundColor Yellow
Write-Host "Failed: $failed" -ForegroundColor Red

# Count folders in scripts directory
$routeFolders = Get-ChildItem -Path $scriptsPath -Directory | Where-Object { $_.Name -match "Routes" }
Write-Host ""
Write-Host "Total route folders in scripts: $($routeFolders.Count)" -ForegroundColor Cyan

Write-Host ""
Write-Host "Ready to run batch processing!" -ForegroundColor Green
Write-Host "   Run: cd $scriptsPath" -ForegroundColor White
Write-Host "   Then: node batch_process_routes.js" -ForegroundColor White
Write-Host ""
