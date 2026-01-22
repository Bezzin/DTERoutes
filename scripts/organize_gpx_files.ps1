# Script to organize GPX files into test centre folders
$scriptsPath = "C:\Users\Nathaniel\Documents\DTEwithphonelocationontest\scripts"

Write-Host ""
Write-Host "Organizing GPX files into test centre folders..." -ForegroundColor Cyan
Write-Host ("=" * 60)

# Get all GPX files (excluding those already in subfolders)
$gpxFiles = Get-ChildItem -Path $scriptsPath -Filter "*.gpx" -File | Where-Object { $_.DirectoryName -eq $scriptsPath }
$totalFiles = $gpxFiles.Count

Write-Host ""
Write-Host "Found $totalFiles GPX files to organize" -ForegroundColor Green
Write-Host ""

$processed = 0
$folderMap = @{}

foreach ($gpxFile in $gpxFiles) {
    $processed++
    $fileName = $gpxFile.Name

    # Extract test centre name from filename (everything before " - Route" or " - Free Sample Route")
    if ($fileName -match '^(.+?) - (Route \d+|Free Sample Route)\.gpx$') {
        $testCentreName = $matches[1]

        # Create folder name: replace spaces with hyphens
        $folderName = $testCentreName -replace '\s+', '-'
        $folderName = "$folderName-Routes"

        # Track this test centre
        if (-not $folderMap.ContainsKey($folderName)) {
            $folderMap[$folderName] = @()
        }
        $folderMap[$folderName] += $fileName

        # Create folder if it doesn't exist
        $folderPath = Join-Path $scriptsPath $folderName
        if (-not (Test-Path $folderPath)) {
            New-Item -ItemType Directory -Path $folderPath | Out-Null
        }

        # Move GPX file to folder
        $destPath = Join-Path $folderPath $fileName
        Move-Item -Path $gpxFile.FullName -Destination $destPath -Force

        if ($processed % 50 -eq 0) {
            Write-Host "Progress: $processed/$totalFiles files organized" -ForegroundColor Cyan
        }
    } else {
        Write-Host "Warning: Could not parse filename: $fileName" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host ("=" * 60)
Write-Host "ORGANIZATION SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 60)
Write-Host "Total GPX files processed: $processed"
Write-Host "Test centres created: $($folderMap.Count)" -ForegroundColor Green
Write-Host ""

# Show first 10 test centres
Write-Host "Sample test centres:"
$folderMap.Keys | Select-Object -First 10 | ForEach-Object {
    Write-Host "  $_ ($($folderMap[$_].Count) routes)"
}

Write-Host ""
Write-Host "Ready to run batch processing!" -ForegroundColor Green
Write-Host "   Run: cd $scriptsPath" -ForegroundColor White
Write-Host "   Then: node batch_process_routes.js" -ForegroundColor White
Write-Host ""
