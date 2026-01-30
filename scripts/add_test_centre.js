#!/usr/bin/env node

/**
 * Test Centre Helper Script
 * ==========================
 * Adds or updates test centres in the Supabase database
 *
 * Usage:
 *   node add_test_centre.js <id> <name> <city> <postcode> <lat> <lon>
 *
 * Example:
 *   node add_test_centre.js stoke-on-trent-cobridge "Stoke-On-Trent (Cobridge) Driving Test Centre" "Stoke-on-Trent" "ST6 2DL" 53.040465 -2.18805
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Add or update a test centre in the database
 */
async function addTestCentre(id, name, city, postcode, lat, lon) {
  console.log('\n📍 Adding Test Centre');
  console.log('═'.repeat(60));
  console.log(`  ID: ${id}`);
  console.log(`  Name: ${name}`);
  console.log(`  City: ${city}`);
  console.log(`  Postcode: ${postcode}`);
  console.log(`  Location: ${lat}, ${lon}`);

  // Check if test centre already exists
  const { data: existing, error: checkError } = await supabase
    .from('test_centers')
    .select('id, name')
    .eq('id', id)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 is "not found" error, which is expected
    throw checkError;
  }

  if (existing) {
    console.log(`\n  ⚠️  Test centre already exists: ${existing.name}`);
    console.log('  Updating location...');

    // Update existing test centre
    const { error: updateError } = await supabase
      .from('test_centers')
      .update({
        name: name,
        city: city,
        postcode: postcode,
        location: `SRID=4326;POINT(${lon} ${lat})`,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    console.log('  ✅ Test centre updated successfully!');
  } else {
    console.log('\n  ➕ Creating new test centre...');

    // Insert new test centre
    const { error: insertError } = await supabase
      .from('test_centers')
      .insert({
        id: id,
        name: name,
        city: city,
        postcode: postcode,
        location: `SRID=4326;POINT(${lon} ${lat})`,
        route_count: 0
      });

    if (insertError) throw insertError;

    console.log('  ✅ Test centre created successfully!');
  }

  console.log('═'.repeat(60));
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 6) {
    console.error('\n❌ Usage: node add_test_centre.js <id> <name> <city> <postcode> <lat> <lon>');
    console.error('\nExample:');
    console.error('  node add_test_centre.js stoke-on-trent-cobridge "Stoke-On-Trent (Cobridge) Driving Test Centre" "Stoke-on-Trent" "ST6 2DL" 53.040465 -2.18805\n');
    process.exit(1);
  }

  const [id, name, city, postcode, latStr, lonStr] = args;
  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  // Validate coordinates
  if (isNaN(lat) || isNaN(lon)) {
    console.error('\n❌ Error: Invalid latitude or longitude');
    process.exit(1);
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    console.error('\n❌ Error: Coordinates out of range');
    console.error('  Latitude must be between -90 and 90');
    console.error('  Longitude must be between -180 and 180');
    process.exit(1);
  }

  try {
    await addTestCentre(id, name, city, postcode, lat, lon);
    console.log('\n🎉 Success!\n');
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

module.exports = { addTestCentre };
