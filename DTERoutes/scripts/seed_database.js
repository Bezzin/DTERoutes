#!/usr/bin/env node

/**
 * Database Seeding Script
 * ========================
 * Seeds processed routes into Supabase database
 *
 * Prerequisites:
 * 1. Run supabase_schema.sql in Supabase SQL Editor first
 * 2. Process route through process_routes.js
 * 3. Run this script to import into database
 *
 * Usage:
 *   node seed_database.js <processed_route.json> <test_center_id>
 *
 * Example:
 *   node seed_database.js ./stoke_route_1_processed.json stoke-on-trent-newcastle-under-lyme
 */

const fs = require('fs');
const path = require('path');
const {createClient} = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({path: path.join(__dirname, '../.env')});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file',
  );
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Convert GeoJSON LineString to PostGIS LINESTRING
 */
function coordinatesToWKT(coordinates) {
  const points = coordinates.map(c => `${c[0]} ${c[1]}`).join(',');
  return `SRID=4326;LINESTRING(${points})`;
}

/**
 * Seed a single processed route into the database
 */
async function seedRoute(processedFile, testCenterId) {
  console.log('\n💾 Supabase Database Seeding');
  console.log('═'.repeat(60));

  // Verify file exists
  if (!fs.existsSync(processedFile)) {
    throw new Error(`Processed route file not found: ${processedFile}`);
  }

  // Load processed route data
  console.log(`📖 Reading: ${path.basename(processedFile)}`);
  const data = JSON.parse(fs.readFileSync(processedFile, 'utf-8'));

  const originalFeature = data.original_geojson.features[0];
  const mapboxRoute = data.mapbox_route;
  const coords = originalFeature.geometry.coordinates;

  console.log('\n📊 Route Details:');
  console.log(`   Name: ${originalFeature.properties.name}`);
  console.log(`   Test Center ID: ${testCenterId}`);
  console.log(`   Distance: ${originalFeature.properties.distance_km} km`);
  console.log(
    `   Duration: ${originalFeature.properties.estimated_duration_mins} mins`,
  );
  console.log(`   GPS Points: ${originalFeature.properties.point_count}`);
  console.log(
    `   Navigation Points: ${mapboxRoute.geometry.coordinates.length}`,
  );

  // Verify test center exists
  console.log('\n🔍 Verifying test center exists...');
  const {data: testCenter, error: testCenterError} = await supabase
    .from('test_centers')
    .select('id, name')
    .eq('id', testCenterId)
    .single();

  if (testCenterError || !testCenter) {
    throw new Error(
      `Test center not found: ${testCenterId}. Run supabase_schema.sql first!`,
    );
  }

  console.log(`   ✅ Found: ${testCenter.name}`);

  // Check if route already exists
  const routeNumber = extractRouteNumber(originalFeature.properties.name);
  console.log(`\n🔍 Checking for existing route ${routeNumber}...`);

  const {data: existingRoute} = await supabase
    .from('routes')
    .select('id')
    .eq('test_center_id', testCenterId)
    .eq('route_number', routeNumber)
    .single();

  if (existingRoute) {
    console.log(`   ⚠️  Route ${routeNumber} already exists. Updating...`);

    // Update existing route
    const {error: updateError} = await supabase
      .from('routes')
      .update({
        name: originalFeature.properties.name,
        distance_km: originalFeature.properties.distance_km,
        estimated_duration_mins:
          originalFeature.properties.estimated_duration_mins,
        difficulty: 'moderate',
        point_count: originalFeature.properties.point_count,
        geojson: data.original_geojson,
        mapbox_route: mapboxRoute,
        is_processed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingRoute.id);

    if (updateError) {
      throw updateError;
    }

    console.log('   ✅ Route updated successfully!');
  } else {
    console.log('   ➕ Inserting new route...');

    // Insert new route
    const {data: newRoute, error: insertError} = await supabase
      .from('routes')
      .insert({
        test_center_id: testCenterId,
        name: originalFeature.properties.name,
        route_number: routeNumber,
        distance_km: originalFeature.properties.distance_km,
        estimated_duration_mins:
          originalFeature.properties.estimated_duration_mins,
        difficulty: 'moderate',
        point_count: originalFeature.properties.point_count,
        geojson: data.original_geojson,
        mapbox_route: mapboxRoute,
        is_processed: true,
      })
      .select();

    if (insertError) {
      throw insertError;
    }

    console.log(`   ✅ Route inserted with ID: ${newRoute[0].id}`);
  }

  // Update test center route count
  const {count} = await supabase
    .from('routes')
    .select('*', {count: 'exact', head: true})
    .eq('test_center_id', testCenterId);

  await supabase
    .from('test_centers')
    .update({route_count: count})
    .eq('id', testCenterId);

  console.log('\n✅ Database seeding complete!');
  console.log('═'.repeat(60));
}

/**
 * Extract route number from route name
 * e.g., "Stoke-on-Trent - Route 1" => 1
 */
function extractRouteNumber(routeName) {
  const match = routeName.match(/Route\s+(\d+)/i);
  return match ? parseInt(match[1]) : 1;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      '\n❌ Usage: node seed_database.js <processed_route.json> <test_center_id>',
    );
    console.error('\nExample:');
    console.error(
      '  node seed_database.js ./stoke_route_1_processed.json stoke-on-trent-newcastle-under-lyme\n',
    );
    process.exit(1);
  }

  const processedFile = args[0];
  const testCenterId = args[1];

  try {
    await seedRoute(processedFile, testCenterId);
    console.log(
      '\n🎉 Success! Route is now in the database and ready to use.\n',
    );
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

module.exports = {seedRoute};
