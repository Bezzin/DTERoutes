#!/usr/bin/env node

/**
 * Batch Route Processing Script
 * ==============================
 * Automates processing of all GPX routes for multiple test centres
 *
 * This script:
 * 1. Scans designated folders for GPX files
 * 2. Creates test centres in database if needed
 * 3. For each GPX file:
 *    - Converts to GeoJSON
 *    - Processes through Mapbox Map Matching API
 *    - Seeds to Supabase database
 * 4. Handles errors gracefully (logs and continues)
 * 5. Provides progress updates
 * 6. Generates summary report
 *
 * Usage:
 *   node batch_process_routes.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { convertGpxToGeoJSON } = require('./convert_gpx_to_geojson');
const { processRoute } = require('./process_routes');
const { seedRoute } = require('./seed_database');
const { discoverTestCentres } = require('./auto_discover');
const { geocodeTestCentre } = require('./geocode_test_centre');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../DTERoutes/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const SCRIPTS_DIR = __dirname;
const TEMP_DIR = path.join(SCRIPTS_DIR, 'temp_processing');
const ERROR_LOG_FILE = path.join(SCRIPTS_DIR, 'processing_errors.log');

// Create temp directory if it doesn't exist
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Clear error log
fs.writeFileSync(ERROR_LOG_FILE, `Batch Processing Error Log - ${new Date().toISOString()}\n${'='.repeat(60)}\n\n`);

/**
 * Log error to file
 */
function logError(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(ERROR_LOG_FILE, `[${timestamp}] ${message}\n\n`);
}

/**
 * Build test centre configuration dynamically by discovering folders and geocoding
 */
async function buildTestCentreConfig() {
  console.log('\n🔍 Auto-discovering test centre folders...');

  const discovered = await discoverTestCentres(__dirname);
  console.log(`   Found ${discovered.length} test centre folders\n`);

  if (discovered.length === 0) {
    console.warn('⚠️  No test centre folders found!');
    return {};
  }

  const config = {};

  for (let i = 0; i < discovered.length; i++) {
    const centre = discovered[i];
    console.log(`   [${i + 1}/${discovered.length}] Geocoding "${centre.name}"...`);

    try {
      const geo = await geocodeTestCentre(centre.name);

      config[centre.folderName] = {
        id: centre.id,
        name: centre.name,
        city: geo.city,
        postcode: geo.postcode,
        location: { lat: geo.latitude, lon: geo.longitude },
        skip_test_centre_creation: false
      };

      console.log(`       ✓ ${geo.city || 'UK'} (${geo.latitude.toFixed(4)}, ${geo.longitude.toFixed(4)})`);
    } catch (error) {
      console.error(`       ✗ Failed to geocode: ${error.message}`);
      logError(`Failed to geocode ${centre.name}: ${error.message}`);
    }
  }

  console.log(`\n   ✅ Configuration built for ${Object.keys(config).length} test centres\n`);
  return config;
}

/**
=======
>>>>>>> origin/ios-dev
 * Add or update a test centre in the database
 */
async function addTestCentre(config) {
  const { id, name, city, postcode, location } = config;

  console.log(`\n📍 Setting up test centre: ${name}`);

  // Check if test centre already exists
  const { data: existing, error: checkError } = await supabase
    .from('test_centers')
    .select('id, name')
    .eq('id', id)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    throw checkError;
  }

  if (existing) {
    console.log(`   ✓ Test centre already exists`);
    return;
  }

  // Insert new test centre
  console.log(`   ➕ Creating new test centre...`);
  const { error: insertError } = await supabase
    .from('test_centers')
    .insert({
      id: id,
      name: name,
      city: city,
      postcode: postcode,
      location: `SRID=4326;POINT(${location.lon} ${location.lat})`,
      route_count: 0
    });

  if (insertError) throw insertError;

  console.log(`   ✅ Test centre created`);
}

/**
 * Check if route already exists in database
 */
async function routeExists(testCenterId, routeNumber) {
  const { data, error } = await supabase
    .from('routes')
    .select('id')
    .eq('test_center_id', testCenterId)
    .eq('route_number', routeNumber)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return !!data;
}

/**
 * Process a single GPX file
 */
async function processGpxFile(gpxPath, testCentreConfig) {
  const filename = path.basename(gpxPath);

  // Extract route number from filename
  const routeNumberMatch = filename.match(/Route (\d+)\.gpx$/i);
  if (!routeNumberMatch) {
    throw new Error(`Could not extract route number from filename: ${filename}`);
  }
  const routeNumber = parseInt(routeNumberMatch[1]);

  // Check if route already exists
  const exists = await routeExists(testCentreConfig.id, routeNumber);
  if (exists) {
    console.log(`   ⏭️  Route ${routeNumber} already exists, skipping...`);
    return { status: 'skipped', routeNumber };
  }

  // Generate temp file paths
  const geojsonPath = path.join(TEMP_DIR, `${testCentreConfig.id}_route_${routeNumber}.geojson`);
  const processedPath = path.join(TEMP_DIR, `${testCentreConfig.id}_route_${routeNumber}_processed.json`);

  try {
    // Step 1: Convert GPX to GeoJSON
    console.log(`   🔄 Converting to GeoJSON...`);
    const geojson = await convertGpxToGeoJSON(gpxPath);
    fs.writeFileSync(geojsonPath, JSON.stringify(geojson, null, 2));

    // Step 2: Process through Mapbox
    console.log(`   🗺️  Processing through Mapbox API...`);
    const processed = await processRoute(geojsonPath);
    fs.writeFileSync(processedPath, JSON.stringify(processed, null, 2));

    // Step 3: Seed to database
    console.log(`   💾 Seeding to database...`);
    await seedRoute(processedPath, testCentreConfig.id);

    // Clean up temp files
    fs.unlinkSync(geojsonPath);
    fs.unlinkSync(processedPath);

    return { status: 'success', routeNumber };

  } catch (error) {
    // Clean up temp files on error
    if (fs.existsSync(geojsonPath)) fs.unlinkSync(geojsonPath);
    if (fs.existsSync(processedPath)) fs.unlinkSync(processedPath);

    throw error;
  }
}

/**
 * Process all routes for a test centre
 */
async function processTestCentre(folderName, config) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📍 Processing: ${config.name}`);
  console.log(`${'='.repeat(60)}`);

  const folderPath = path.join(SCRIPTS_DIR, folderName);

  // Create test centre if needed
  if (!config.skip_test_centre_creation) {
    try {
      await addTestCentre(config);
    } catch (error) {
      console.error(`   ❌ Failed to create test centre: ${error.message}`);
      logError(`Failed to create test centre ${config.id}: ${error.message}\n${error.stack}`);
      return { total: 0, success: 0, skipped: 0, failed: 0 };
    }
  }

  // Find all GPX files (excluding __MACOSX)
  const files = fs.readdirSync(folderPath)
    .filter(f => f.endsWith('.gpx') && !f.startsWith('.'))
    .sort((a, b) => {
      const aNum = parseInt(a.match(/Route (\d+)/i)?.[1] || '0');
      const bNum = parseInt(b.match(/Route (\d+)/i)?.[1] || '0');
      return aNum - bNum;
    });

  console.log(`\n   Found ${files.length} route files`);

  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  // Process each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const gpxPath = path.join(folderPath, file);

    console.log(`\n   [${i + 1}/${files.length}] ${file}`);

    try {
      const result = await processGpxFile(gpxPath, config);

      if (result.status === 'success') {
        successCount++;
        console.log(`   ✅ Route ${result.routeNumber} processed successfully`);
      } else if (result.status === 'skipped') {
        skippedCount++;
      }

    } catch (error) {
      failedCount++;
      console.error(`   ❌ Failed: ${error.message}`);
      logError(`${config.id} - ${file}: ${error.message}\n${error.stack}`);
    }

    // Progress update every 5 routes
    if ((i + 1) % 5 === 0) {
      console.log(`\n   📊 Progress: ${i + 1}/${files.length} routes processed`);
    }
  }

  return {
    total: files.length,
    success: successCount,
    skipped: skippedCount,
    failed: failedCount
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🚀 Batch Route Processing');
  console.log('═'.repeat(60));
  console.log(`Started at: ${new Date().toLocaleString()}`);
  console.log(`Error log: ${ERROR_LOG_FILE}`);

  const startTime = Date.now();

  // Build test centre configuration dynamically
  const TEST_CENTRE_CONFIG = await buildTestCentreConfig();

  if (Object.keys(TEST_CENTRE_CONFIG).length === 0) {
    console.log('\n⚠️  No test centres to process. Exiting.\n');
    return;
  }

  const results = {};

  // Process each test centre
  for (const [folderName, config] of Object.entries(TEST_CENTRE_CONFIG)) {
    const folderPath = path.join(SCRIPTS_DIR, folderName);

    if (!fs.existsSync(folderPath)) {
      console.log(`\n⚠️  Folder not found: ${folderName}, skipping...`);
      continue;
    }

    try {
      results[config.id] = await processTestCentre(folderName, config);
    } catch (error) {
      console.error(`\n❌ Fatal error processing ${config.name}: ${error.message}`);
      logError(`Fatal error for ${config.id}: ${error.message}\n${error.stack}`);
      results[config.id] = { total: 0, success: 0, skipped: 0, failed: 0 };
    }
  }

  // Generate summary report
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60); // minutes

  console.log(`\n\n${'='.repeat(60)}`);
  console.log('📊 BATCH PROCESSING SUMMARY');
  console.log(`${'='.repeat(60)}\n`);

  let totalRoutes = 0;
  let totalSuccess = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const [testCentreId, result] of Object.entries(results)) {
    const config = Object.values(TEST_CENTRE_CONFIG).find(c => c.id === testCentreId);
    console.log(`${config.name}:`);
    console.log(`  Total: ${result.total}`);
    console.log(`  ✅ Success: ${result.success}`);
    console.log(`  ⏭️  Skipped: ${result.skipped}`);
    console.log(`  ❌ Failed: ${result.failed}\n`);

    totalRoutes += result.total;
    totalSuccess += result.success;
    totalSkipped += result.skipped;
    totalFailed += result.failed;
  }

  console.log(`${'─'.repeat(60)}`);
  console.log(`OVERALL:`);
  console.log(`  Total Routes: ${totalRoutes}`);
  console.log(`  ✅ Success: ${totalSuccess}`);
  console.log(`  ⏭️  Skipped: ${totalSkipped}`);
  console.log(`  ❌ Failed: ${totalFailed}`);
  console.log(`\n  ⏱️  Duration: ${duration} minutes`);
  console.log(`  📄 Error log: ${ERROR_LOG_FILE}`);

  console.log(`\n${'='.repeat(60)}`);

  if (totalFailed > 0) {
    console.log('\n⚠️  Some routes failed. Check the error log for details.\n');
  } else if (totalSuccess > 0) {
    console.log('\n🎉 All routes processed successfully!\n');
  } else {
    console.log('\n✅ No new routes to process.\n');
  }

  // Clean up temp directory
  if (fs.existsSync(TEMP_DIR)) {
    const tempFiles = fs.readdirSync(TEMP_DIR);
    if (tempFiles.length === 0) {
      fs.rmdirSync(TEMP_DIR);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error(`\n❌ Fatal error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { processTestCentre, processGpxFile };
