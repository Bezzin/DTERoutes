# Manually organize the remaining GPX files with non-standard naming
$scriptsPath = "C:\Users\Nathaniel\Documents\DTEwithphonelocationontest\scripts"

# Manual mappings for files with non-standard names
$mappings = @{
    "Basingstoke Driving Test Route 1.gpx" = "Basingstoke-Driving-Test-Centre-Routes"
    "Burgess Hill Driving Test Route 1.gpx" = "Burgess-Hill-Driving-Test-Centre-Routes"
    "Chingford Driving Test Centre Route 1.gpx" = "Chingford-Driving-Test-Centre-Routes"
    "Farnborough Driving Test Centre Route 1.gpx" = "Farnborough-Driving-Test-Centre-Routes"
    "Goodmayes Driving Test Centre Route 1.gpx" = "Goodmayes-Driving-Test-Centre-Routes"
    "Gosforth Driving Test Centre Route 1.gpx" = "Gosforth-Driving-Test-Centre-Routes"
    "Guildford Driving Test Centre Route 1.gpx" = "Guildford-Driving-Test-Centre-Routes"
    "Ipswich_Driving_Test_Centre_Route_1.gpx" = "Ipswich-Driving-Test-Centre-Routes"
    "Isleworth Driving Test Centre Route 1.gpx" = "Isleworth-Driving-Test-Centre-Routes"
    "Loughborough Driving Test Centre - Loughborough Car Test Route 01.gpx" = "Loughborough-Driving-Test-Centre-Routes"
    "Pinner Driving Test Centre Route 1.gpx" = "Pinner-Driving-Test-Centre-Routes"
    "Winchester Driving Test Centre Route 1.gpx" = "Winchester-Driving-Test-Centre-Routes"
}

Write-Host "Organizing remaining files..." -ForegroundColor Cyan

foreach ($fileName in $mappings.Keys) {
    $folderName = $mappings[$fileName]
    $gpxPath = Join-Path $scriptsPath $fileName

    if (Test-Path $gpxPath) {
        # Create folder if needed
        $folderPath = Join-Path $scriptsPath $folderName
        if (-not (Test-Path $folderPath)) {
            New-Item -ItemType Directory -Path $folderPath | Out-Null
        }

        # Rename file to standard format if needed
        $newFileName = $fileName
        if ($fileName -match '^(.+?)\s+(Driving Test|Route)') {
            $centreBase = $matches[1].Trim()
            $newFileName = "$centreBase Driving Test Centre - Route 1.gpx"
        }

        # Move file
        $destPath = Join-Path $folderPath $newFileName
        Move-Item -Path $gpxPath -Destination $destPath -Force
        Write-Host "  Moved: $fileName -> $folderName" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Done! All GPX files organized." -ForegroundColor Green
