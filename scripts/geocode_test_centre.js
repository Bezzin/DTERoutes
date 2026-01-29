const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const https = require('https');

// Cache to avoid duplicate API calls
const geocodeCache = new Map();

// Fallback coordinates (approximate center of UK)
const UK_CENTER = {
  latitude: 52.5,
  longitude: -1.5,
  city: null,
  postcode: null
};

/**
 * Makes an HTTPS GET request to Mapbox Geocoding API
 * @param {string} url - The full API URL
 * @returns {Promise<object>} Parsed JSON response
 */
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Geocodes a test centre name using Mapbox Geocoding API
 * @param {string} name - The test centre name (e.g., "London Driving Test Centre")
 * @returns {Promise<{city: string|null, postcode: string|null, latitude: number, longitude: number}>}
 */
async function geocodeTestCentre(name) {
  // Check cache first
  if (geocodeCache.has(name)) {
    return geocodeCache.get(name);
  }

  const mapboxToken = process.env.MAPBOX_PUBLIC_TOKEN;
  if (!mapboxToken) {
    console.warn('Warning: MAPBOX_PUBLIC_TOKEN not found in environment, using fallback coordinates');
    return UK_CENTER;
  }

  try {
    // Construct geocoding query
    const query = encodeURIComponent(`${name}, United Kingdom`);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxToken}&country=GB&types=place,locality,address&limit=1`;

    const response = await httpsGet(url);

    if (!response.features || response.features.length === 0) {
      console.warn(`Warning: No geocoding results for "${name}", using fallback coordinates`);
      geocodeCache.set(name, UK_CENTER);
      return UK_CENTER;
    }

    const feature = response.features[0];
    const [longitude, latitude] = feature.center;

    // Extract city and postcode from context
    let city = null;
    let postcode = null;

    if (feature.context) {
      for (const ctx of feature.context) {
        if (ctx.id.startsWith('place.')) {
          city = ctx.text;
        } else if (ctx.id.startsWith('postcode.')) {
          postcode = ctx.text;
        }
      }
    }

    // If no city found in context, try using the place_name
    if (!city && feature.place_name) {
      const parts = feature.place_name.split(',');
      if (parts.length > 1) {
        city = parts[1].trim();
      }
    }

    const result = {
      city,
      postcode,
      latitude,
      longitude
    };

    // Cache the result
    geocodeCache.set(name, result);

    return result;
  } catch (error) {
    console.error(`Error geocoding "${name}": ${error.message}`);
    console.warn('Using fallback coordinates');
    geocodeCache.set(name, UK_CENTER);
    return UK_CENTER;
  }
}

/**
 * Clears the geocoding cache (useful for testing)
 */
function clearCache() {
  geocodeCache.clear();
}

module.exports = {
  geocodeTestCentre,
  clearCache
};
