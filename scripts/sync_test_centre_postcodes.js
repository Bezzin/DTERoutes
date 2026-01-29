#!/usr/bin/env node

/**
 * Sync DVSA Test Centre Postcodes
 * ================================
 * Updates test_centers table with correct postcodes, addresses, and coordinates
 * from the official DVSA data (FOI request data via JakeCracknell/dvsa_driving_test_data)
 *
 * Usage:
 *   node sync_test_centre_postcodes.js [--dry-run]
 *
 * Options:
 *   --dry-run  Preview changes without updating the database
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const CSV_PATH = path.join(__dirname, 'dvsa_test_centres.csv')

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Parse the DVSA CSV file
 */
function parseDvsaCsv(csvPath) {
  const content = fs.readFileSync(csvPath, 'utf-8')
  const lines = content.split('\n')

  const centres = []
  let inDataSection = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Skip header rows until we hit the data
    if (trimmed.startsWith('Permanent,ADDRESS LINE')) {
      inDataSection = true
      continue
    }

    // Skip section headers for Remote and TTTTC
    if (trimmed.startsWith('Remote,') || trimmed.startsWith('TTTTC')) {
      continue
    }

    if (!inDataSection) continue

    // Parse CSV line (handling quoted fields)
    const fields = parseCSVLine(line)

    if (fields.length < 9) continue

    const name = fields[0]?.trim()
    if (!name || name === 'Remote' || name === 'TTTTC Sites') continue

    // Combine address lines
    const addressParts = [
      fields[1],
      fields[2],
      fields[3],
      fields[4],
      fields[5]
    ].filter(p => p && p.trim()).map(p => p.trim())

    const address = addressParts.join(', ')
    const postcode = fields[6]?.trim()
    const latitude = parseFloat(fields[7])
    const longitude = parseFloat(fields[8])
    const tcId = fields[9]?.trim()

    if (!postcode || isNaN(latitude) || isNaN(longitude)) continue

    centres.push({
      name,
      address,
      postcode,
      latitude,
      longitude,
      tcId
    })
  }

  return centres
}

/**
 * Parse a CSV line handling quoted fields
 */
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)

  return result
}

/**
 * Normalize a centre name for matching
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/driving test centre( routes)?/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

/**
 * Generate slug from centre name
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/driving test centre( routes)?/gi, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim()
}

/**
 * Extract city from address or name
 */
function extractCity(name, address) {
  // Try to extract from name (e.g., "Birmingham (Kingstanding)" -> "Birmingham")
  const match = name.match(/^([^(]+)/)
  if (match) {
    return match[1].trim()
  }

  // Otherwise use the last significant part of the address
  const parts = address.split(',').map(p => p.trim()).filter(Boolean)
  if (parts.length > 1) {
    return parts[parts.length - 2] || parts[parts.length - 1]
  }

  return name
}

/**
 * Main sync function
 */
async function syncPostcodes(dryRun = false) {
  console.log('\nDVSA Test Centre Postcode Sync')
  console.log('='.repeat(60))
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`)
  console.log()

  // Read DVSA data
  console.log('Reading DVSA CSV data...')
  const dvsaCentres = parseDvsaCsv(CSV_PATH)
  console.log(`Found ${dvsaCentres.length} centres in DVSA data`)

  // Create lookup maps
  const dvsaByNormalized = new Map()
  const dvsaBySlug = new Map()

  for (const centre of dvsaCentres) {
    const normalized = normalizeName(centre.name)
    const slug = generateSlug(centre.name)

    dvsaByNormalized.set(normalized, centre)
    dvsaBySlug.set(slug, centre)
  }

  // Fetch existing test centres from Supabase
  console.log('Fetching test centres from Supabase...')
  const { data: existingCentres, error } = await supabase
    .from('test_centers')
    .select('id, name, city, postcode, address')

  if (error) {
    console.error('Error fetching test centres:', error.message)
    process.exit(1)
  }

  console.log(`Found ${existingCentres.length} centres in database`)
  console.log()

  // Match and prepare updates
  const updates = []
  const notFound = []
  const alreadyCorrect = []

  for (const existing of existingCentres) {
    // Try to match by slug (ID)
    let dvsaCentre = dvsaBySlug.get(existing.id.replace(/-driving-test-centre-routes$/, ''))

    // Try normalized name match
    if (!dvsaCentre) {
      const normalized = normalizeName(existing.name)
      dvsaCentre = dvsaByNormalized.get(normalized)
    }

    // Try partial matching
    if (!dvsaCentre) {
      for (const [key, centre] of dvsaByNormalized) {
        if (key.includes(normalizeName(existing.name)) ||
            normalizeName(existing.name).includes(key)) {
          dvsaCentre = centre
          break
        }
      }
    }

    if (!dvsaCentre) {
      notFound.push(existing.name)
      continue
    }

    // Check if update is needed
    if (existing.postcode === dvsaCentre.postcode) {
      alreadyCorrect.push(existing.name)
      continue
    }

    const city = extractCity(dvsaCentre.name, dvsaCentre.address)

    updates.push({
      id: existing.id,
      currentName: existing.name,
      dvsaName: dvsaCentre.name,
      oldPostcode: existing.postcode,
      newPostcode: dvsaCentre.postcode,
      address: dvsaCentre.address,
      city: city,
      latitude: dvsaCentre.latitude,
      longitude: dvsaCentre.longitude
    })
  }

  // Summary
  console.log('Match Summary')
  console.log('-'.repeat(60))
  console.log(`  Updates needed: ${updates.length}`)
  console.log(`  Already correct: ${alreadyCorrect.length}`)
  console.log(`  Not found in DVSA data: ${notFound.length}`)
  console.log()

  if (notFound.length > 0 && notFound.length <= 20) {
    console.log('Centres not found in DVSA data:')
    for (const name of notFound) {
      console.log(`  - ${name}`)
    }
    console.log()
  }

  if (updates.length === 0) {
    console.log('No updates needed!')
    return
  }

  // Show sample updates
  console.log('Sample updates (first 10):')
  console.log('-'.repeat(60))
  for (const update of updates.slice(0, 10)) {
    console.log(`  ${update.currentName}`)
    console.log(`    Postcode: ${update.oldPostcode || 'null'} -> ${update.newPostcode}`)
    console.log(`    City: ${update.city}`)
    console.log()
  }

  if (dryRun) {
    console.log('DRY RUN complete. No changes were made.')
    console.log(`Run without --dry-run to apply ${updates.length} updates.`)
    return
  }

  // Apply updates
  console.log('Applying updates...')
  let successCount = 0
  let errorCount = 0

  for (const update of updates) {
    const { error: updateError } = await supabase
      .from('test_centers')
      .update({
        postcode: update.newPostcode,
        address: update.address,
        city: update.city,
        location: `SRID=4326;POINT(${update.longitude} ${update.latitude})`,
        updated_at: new Date().toISOString()
      })
      .eq('id', update.id)

    if (updateError) {
      console.error(`  Error updating ${update.currentName}: ${updateError.message}`)
      errorCount++
    } else {
      successCount++
    }
  }

  console.log()
  console.log('Update Complete')
  console.log('-'.repeat(60))
  console.log(`  Successful: ${successCount}`)
  console.log(`  Errors: ${errorCount}`)
}

// Run
const dryRun = process.argv.includes('--dry-run')
syncPostcodes(dryRun).catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
