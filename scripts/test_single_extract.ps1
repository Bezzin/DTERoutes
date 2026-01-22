$downloadsPath = "C:\Users\Nathaniel\Downloads\Free test Routes"
$testDir = "C:\Users\Nathaniel\Documents\DTEwithphonelocationontest\scripts\test_extract"
$zipFile = "Aberdeen-North-Driving-Test-Centre-Routes-Free-Sample-Route-pfe6tj.zip"

# Create test directory
New-Item -ItemType Directory -Force -Path $testDir | Out-Null

# Extract one zip file
$zipPath = Join-Path $downloadsPath $zipFile
Expand-Archive -Path $zipPath -DestinationPath $testDir -Force

# Show what's inside
Write-Host "Contents of extracted zip:"
Get-ChildItem -Path $testDir -Recurse | ForEach-Object { Write-Host "  $_" }
