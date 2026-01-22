#!/usr/bin/env node

/**
 * GPX to GeoJSON Converter
 * =========================
 * Converts GPX files (waypoint-based) to GeoJSON format for route processing.
 *
 * This script:
 * 1. Parses GPX XML files containing waypoints
 * 2. Extracts waypoint coordinates
 * 3. Converts coordinate order (GPX: lat,lon → GeoJSON: [lon,lat])
 * 4. Calculates route distance using Haversine formula
 * 5. Estimates duration based on UK driving test average speed
 * 6. Outputs GeoJSON FeatureCollection compatible with process_routes.js
 *
 * Usage:
 *   node convert_gpx_to_geojson.js <input.gpx> <output.geojson>
 *
 * Example:
 *   node convert_gpx_to_geojson.js "Stoke-On-Trent (Cobridge) - Route 1.gpx" cobridge_route_1.geojson
 */

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate total route distance from coordinate array
 */
function calculateRouteDistance(coordinates) {
  let totalKm = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const [lon1, lat1] = coordinates[i - 1];
    const [lon2, lat2] = coordinates[i];
    totalKm += haversineDistance(lat1, lon1, lat2, lon2);
  }
  return totalKm;
}

/**
 * Extract route name and number from filename
 */
function parseRouteName(filename) {
  const basename = path.basename(filename, '.gpx');
  const routeNumberMatch = basename.match(/Route (\d+)/i);
  const routeNumber = routeNumberMatch ? parseInt(routeNumberMatch[1]) : 1;

  return {
    name: basename,
    routeNumber: routeNumber
  };
}

/**
 * Parse GPX file and convert to GeoJSON
 * Supports multiple GPX formats:
 * - <wpt> waypoints (direct children of gpx)
 * - <rtept> route points (inside <rte> elements)
 * - <trkpt> track points (inside <trk>/<trkseg> elements)
 */
async function convertGpxToGeoJSON(gpxPath) {
  console.log(`\n📍 Converting: ${path.basename(gpxPath)}`);
  console.log('─'.repeat(60));

  // Read GPX file
  const gpxContent = fs.readFileSync(gpxPath, 'utf-8');

  // Parse XML
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(gpxContent);

  // Extract waypoints from various GPX formats
  let waypoints = [];
  let sourceType = '';

  // Try waypoints (wpt)
  if (result.gpx.wpt && result.gpx.wpt.length > 0) {
    waypoints = result.gpx.wpt;
    sourceType = 'waypoints (wpt)';
  }
  // Try route points (rtept inside rte)
  else if (result.gpx.rte && result.gpx.rte.length > 0 && result.gpx.rte[0].rtept) {
    waypoints = result.gpx.rte[0].rtept;
    sourceType = 'route points (rtept)';
  }
  // Try track points (trkpt inside trk/trkseg)
  else if (result.gpx.trk && result.gpx.trk.length > 0) {
    const trk = result.gpx.trk[0];
    if (trk.trkseg && trk.trkseg.length > 0 && trk.trkseg[0].trkpt) {
      waypoints = trk.trkseg[0].trkpt;
      sourceType = 'track points (trkpt)';
    }
  }

  if (!waypoints || waypoints.length === 0) {
    throw new Error('No waypoints found in GPX file (tried wpt, rtept, trkpt)');
  }

  console.log(`  📊 Found ${waypoints.length} ${sourceType}`);

  // Convert waypoints to GeoJSON coordinates [lon, lat]
  const coordinates = waypoints.map(wpt => {
    const lat = parseFloat(wpt.$.lat);
    const lon = parseFloat(wpt.$.lon);
    return [lon, lat]; // CRITICAL: GeoJSON uses [lon, lat] not [lat, lon]
  });

  // Calculate metadata
  const distanceKm = calculateRouteDistance(coordinates);
  const estimatedDurationMins = Math.round((distanceKm / 25) * 60); // 25 km/h average

  console.log(`  📏 Distance: ${distanceKm.toFixed(2)} km`);
  console.log(`  ⏱️  Estimated duration: ${estimatedDurationMins} mins`);
  console.log(`  📍 Coordinates: ${coordinates.length} points`);

  // Extract route info from filename
  const { name, routeNumber } = parseRouteName(gpxPath);

  // Create GeoJSON FeatureCollection
  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: name,
          source: 'gpx-import',
          distance_km: parseFloat(distanceKm.toFixed(2)),
          estimated_duration_mins: estimatedDurationMins,
          point_count: coordinates.length
        },
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      }
    ]
  };

  return geojson;
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🗺️  GPX to GeoJSON Converter');
  console.log('═'.repeat(60));

  // Parse command line arguments
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('\n❌ Usage: node convert_gpx_to_geojson.js <input.gpx> <output.geojson>');
    console.error('\nExample:');
    console.error('  node convert_gpx_to_geojson.js "Cobridge - Route 1.gpx" cobridge_route_1.geojson\n');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1];

  // Verify input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`\n❌ Error: Input file not found: ${inputFile}\n`);
    process.exit(1);
  }

  try {
    // Convert GPX to GeoJSON
    const geojson = await convertGpxToGeoJSON(inputFile);

    // Write output
    fs.writeFileSync(outputFile, JSON.stringify(geojson, null, 2));
    console.log(`\n💾 Saved to: ${outputFile}`);
    console.log('═'.repeat(60));
    console.log('✅ Conversion complete! Ready for processing.\n');

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { convertGpxToGeoJSON, parseRouteName, calculateRouteDistance };
