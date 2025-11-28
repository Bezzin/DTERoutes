#!/usr/bin/env node

/**
 * Map Matching Pipeline - CRITICAL SCRIPT
 * ========================================
 * Converts raw GPS trace routes into navigation-ready routes with turn-by-turn instructions.
 *
 * This script:
 * 1. Reads a GeoJSON file with 400-500+ coordinate points
 * 2. Chunks coordinates into batches of 100 (Mapbox API limit)
 * 3. Calls Mapbox Map Matching API for each chunk
 * 4. Stitches responses together into a complete navigation route
 * 5. Outputs processed route with voice instructions and maneuvers
 *
 * Usage:
 *   node process_routes.js <input.geojson> <output.json>
 *
 * Example:
 *   node process_routes.js ../stoke_route_1.geojson ./stoke_route_1_processed.json
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_PUBLIC_TOKEN;
const CHUNK_SIZE = 100; // Mapbox Map Matching API limit
const DELAY_BETWEEN_REQUESTS = 100; // milliseconds

if (!MAPBOX_ACCESS_TOKEN) {
  console.error('❌ Error: MAPBOX_PUBLIC_TOKEN not found in .env file');
  process.exit(1);
}

/**
 * Chunk array into smaller batches
 * Overlaps chunks by 1 coordinate for continuity
 */
function chunkCoordinates(coordinates, chunkSize = CHUNK_SIZE) {
  const chunks = [];
  for (let i = 0; i < coordinates.length; i += chunkSize - 1) {
    chunks.push(coordinates.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Call Mapbox Map Matching API
 * Returns navigation-ready route data with turn-by-turn instructions
 */
async function callMapMatchingAPI(coordinates) {
  const coordString = coordinates
    .map(c => `${c[0]},${c[1]}`)
    .join(';');

  const url =
    `https://api.mapbox.com/matching/v5/mapbox/driving/${coordString}` +
    `?geometries=geojson` +
    `&steps=true` +
    `&overview=full` +
    `&voice_instructions=true` +
    `&banner_instructions=true` +
    `&voice_units=metric` +
    `&access_token=${MAPBOX_ACCESS_TOKEN}`;

  console.log(`    Processing ${coordinates.length} points...`);

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (!data.matchings || data.matchings.length === 0) {
    throw new Error('No matchings returned from API');
  }

  return data;
}

/**
 * Stitch multiple Map Matching responses into a single route
 */
function stitchMatchedRoutes(matchedChunks) {
  if (matchedChunks.length === 1) {
    return matchedChunks[0].matchings[0];
  }

  const allCoordinates = [];
  const allLegs = [];
  let totalDistance = 0;
  let totalDuration = 0;

  for (let i = 0; i < matchedChunks.length; i++) {
    const matching = matchedChunks[i].matchings[0];
    const coords = matching.geometry.coordinates;

    // Avoid duplicate coordinates at chunk boundaries
    if (allCoordinates.length > 0 && i > 0) {
      allCoordinates.push(...coords.slice(1));
    } else {
      allCoordinates.push(...coords);
    }

    allLegs.push(...matching.legs);
    totalDistance += matching.distance;
    totalDuration += matching.duration;
  }

  return {
    distance: totalDistance,
    duration: totalDuration,
    geometry: {
      type: 'LineString',
      coordinates: allCoordinates
    },
    legs: allLegs,
    weight_name: matchedChunks[0].matchings[0].weight_name,
    weight: matchedChunks[0].matchings[0].weight
  };
}

/**
 * Process a single route file through Map Matching pipeline
 */
async function processRoute(geojsonPath) {
  console.log(`\n📍 Processing: ${path.basename(geojsonPath)}`);
  console.log('─'.repeat(60));

  // Read and parse GeoJSON
  const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));
  const feature = geojson.features[0];
  const coordinates = feature.geometry.coordinates;

  console.log(`  📊 Route has ${coordinates.length} GPS points`);
  console.log(`  📏 Distance: ${feature.properties.distance_km} km`);
  console.log(`  ⏱️  Estimated duration: ${feature.properties.estimated_duration_mins} mins`);

  // Chunk coordinates
  const chunks = chunkCoordinates(coordinates);
  console.log(`\n  🔀 Split into ${chunks.length} chunks for processing`);

  // Process each chunk through Map Matching API
  const matchedChunks = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`  📡 Chunk ${i + 1}/${chunks.length}...`);

    try {
      const matched = await callMapMatchingAPI(chunks[i]);
      matchedChunks.push(matched);

      // Rate limiting delay
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
      }
    } catch (error) {
      console.error(`  ❌ Failed on chunk ${i + 1}: ${error.message}`);
      throw error;
    }
  }

  // Stitch chunks together
  console.log(`\n  🧩 Stitching chunks together...`);
  const fullRoute = stitchMatchedRoutes(matchedChunks);

  console.log(`\n  ✅ Processing complete!`);
  console.log(`     Distance: ${(fullRoute.distance / 1000).toFixed(2)} km`);
  console.log(`     Duration: ${Math.round(fullRoute.duration / 60)} mins`);
  console.log(`     Coordinates: ${fullRoute.geometry.coordinates.length} points`);
  console.log(`     Turn instructions: ${fullRoute.legs.reduce((sum, leg) => sum + leg.steps.length, 0)} steps`);

  return {
    original_geojson: geojson,
    mapbox_route: fullRoute,
    processed_at: new Date().toISOString(),
    metadata: {
      chunks_processed: chunks.length,
      total_coordinates: coordinates.length,
      matched_coordinates: fullRoute.geometry.coordinates.length,
      distance_meters: fullRoute.distance,
      duration_seconds: fullRoute.duration
    }
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🗺️  Mapbox Map Matching Pipeline');
  console.log('═'.repeat(60));

  // Parse command line arguments
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('\n❌ Usage: node process_routes.js <input.geojson> <output.json>');
    console.error('\nExample:');
    console.error('  node process_routes.js ../stoke_route_1.geojson ./stoke_route_1_processed.json\n');
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
    // Process the route
    const result = await processRoute(inputFile);

    // Write output
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`\n💾 Saved to: ${outputFile}`);
    console.log('═'.repeat(60));
    console.log('✅ Success! Route is ready for navigation.\n');

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

module.exports = { processRoute, chunkCoordinates, callMapMatchingAPI, stitchMatchedRoutes };
