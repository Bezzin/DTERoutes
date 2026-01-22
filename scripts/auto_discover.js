const fs = require('fs').promises;
const path = require('path');

/**
 * Generates a kebab-case ID from a folder name
 * Example: "Aberdeen-North-Driving-Test-Centre-Routes-Free-Sample-Route-pfe6tj" → "aberdeen-north-driving-test-centre-routes-free-sample-route-pfe6tj"
 */
function generateTestCentreId(folderName) {
  return folderName.toLowerCase();
}

/**
 * Extracts the test centre name from a folder name
 * Example: "Aberdeen-North-Driving-Test-Centre-Routes-Free-Sample-Route-pfe6tj" → "Aberdeen North Driving Test Centre"
 */
function extractTestCentreNameFromFolder(folderName) {
  // Remove the "-Routes-Free-Sample-Route-[randomID]" suffix
  const match = folderName.match(/^(.+?)-Routes-Free-Sample-Route-[a-z0-9]+$/i);

  if (match) {
    // Replace hyphens with spaces and return
    return match[1].replace(/-/g, ' ');
  }

  // Fallback: if pattern doesn't match, try to extract from "-Routes-" prefix
  const fallbackMatch = folderName.match(/^(.+?)-Routes-/);
  if (fallbackMatch) {
    return fallbackMatch[1].replace(/-/g, ' ');
  }

  // Last resort: just replace all hyphens with spaces
  return folderName.replace(/-/g, ' ');
}

/**
 * Extracts the test centre name from a GPX filename
 * Example: "Aberdeen North Driving Test Centre - Route 1.gpx" → "Aberdeen North Driving Test Centre"
 */
function extractTestCentreNameFromGpx(gpxFilename) {
  // Remove .gpx extension
  const withoutExt = gpxFilename.replace(/\.gpx$/i, '');

  // Split by " - Route " or similar patterns and take first part
  const parts = withoutExt.split(/ - (Route \d+|Free Sample Route)/i);
  return parts[0].trim();
}

/**
 * Discovers all test centre folders in the scripts directory
 * @param {string} scriptsPath - Path to the scripts directory
 * @returns {Array} Array of discovered test centres with metadata
 */
async function discoverTestCentres(scriptsPath) {
  try {
    const entries = await fs.readdir(scriptsPath, { withFileTypes: true });
    const discovered = [];

    for (const entry of entries) {
      // Only process directories matching the pattern "*-Routes*" (includes both "*-Routes-*" and "*-Routes")
      if (entry.isDirectory() && entry.name.includes('-Routes')) {
        const folderPath = path.join(scriptsPath, entry.name);

        try {
          // Read GPX files from the folder
          const files = await fs.readdir(folderPath);
          const gpxFiles = files.filter(f => f.toLowerCase().endsWith('.gpx'));

          if (gpxFiles.length === 0) {
            console.warn(`Warning: No GPX files found in ${entry.name}, skipping...`);
            continue;
          }

          // Extract test centre name from folder first, then fall back to GPX filename
          let testCentreName = extractTestCentreNameFromFolder(entry.name);

          // If folder-based extraction looks wrong, try GPX filename
          if (!testCentreName || testCentreName === entry.name) {
            testCentreName = extractTestCentreNameFromGpx(gpxFiles[0]);
          }

          const testCentreId = generateTestCentreId(entry.name);

          discovered.push({
            folderName: entry.name,
            folderPath: folderPath,
            id: testCentreId,
            name: testCentreName,
            gpxFiles: gpxFiles
          });
        } catch (error) {
          console.warn(`Warning: Could not process folder ${entry.name}: ${error.message}`);
        }
      }
    }

    return discovered;
  } catch (error) {
    console.error('Error discovering test centres:', error);
    throw error;
  }
}

module.exports = {
  discoverTestCentres,
  generateTestCentreId,
  extractTestCentreNameFromFolder,
  extractTestCentreNameFromGpx
};
