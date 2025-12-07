/**
 * Route Utilities
 * ================
 * Intelligent waypoint sampling for route visualization
 *
 * Problem: Mapbox Navigation library limits us to 25 total coordinates
 * (origin + 23 waypoints + destination). Our routes have 500+ points.
 *
 * Solution: Sample ~23 strategic waypoints that preserve route shape,
 * prioritizing turns and significant direction changes.
 */

/**
 * Calculate bearing (direction) between two points in degrees
 * @param point1 [longitude, latitude]
 * @param point2 [longitude, latitude]
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(
  point1: [number, number],
  point2: [number, number]
): number {
  const [lon1, lat1] = point1;
  const [lon2, lat2] = point2;

  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360; // Normalize to 0-360
}

/**
 * Calculate distance between two points using Haversine formula
 * @param point1 [longitude, latitude]
 * @param point2 [longitude, latitude]
 * @returns Distance in meters
 */
export function calculateDistance(
  point1: [number, number],
  point2: [number, number]
): number {
  const [lon1, lat1] = point1;
  const [lon2, lat2] = point2;

  const R = 6371000; // Earth's radius in meters
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find points where route changes direction significantly
 * @param coordinates Array of [longitude, latitude] points
 * @param minAngleChange Minimum angle change in degrees to be considered a turn (default 30)
 * @returns Array of indices where significant turns occur
 */
export function findSignificantTurns(
  coordinates: number[][],
  minAngleChange: number = 30
): number[] {
  if (coordinates.length < 3) {
    return [];
  }

  const turnIndices: number[] = [];

  for (let i = 1; i < coordinates.length - 1; i++) {
    const prev = coordinates[i - 1] as [number, number];
    const current = coordinates[i] as [number, number];
    const next = coordinates[i + 1] as [number, number];

    const bearing1 = calculateBearing(prev, current);
    const bearing2 = calculateBearing(current, next);

    // Calculate angle change, accounting for 0/360 wraparound
    let angleChange = Math.abs(bearing2 - bearing1);
    if (angleChange > 180) {
      angleChange = 360 - angleChange;
    }

    if (angleChange >= minAngleChange) {
      turnIndices.push(i);
    }
  }

  return turnIndices;
}

/**
 * Sample waypoints intelligently from route to preserve shape
 *
 * Algorithm:
 * 1. Find all significant turns (bearing change > 30°)
 * 2. If turns < maxWaypoints: add evenly-distributed straight-section points
 * 3. If turns > maxWaypoints: keep only the sharpest turns
 * 4. Return sampled waypoints as [longitude, latitude] array
 *
 * @param coordinates Full route coordinates (excluding origin/destination)
 * @param maxWaypoints Maximum number of waypoints to return (default 23)
 * @returns Array of sampled waypoint coordinates
 */
export function sampleRouteWaypoints(
  coordinates: number[][],
  maxWaypoints: number = 23
): Array<[number, number]> {
  // Handle edge cases
  if (coordinates.length === 0) {
    return [];
  }

  if (coordinates.length <= maxWaypoints) {
    // Route is short enough - use all points
    return coordinates.map(c => [c[0], c[1]] as [number, number]);
  }

  // Step 1: Find all significant turns
  const turnIndices = findSignificantTurns(coordinates, 30);

  if (turnIndices.length === 0) {
    // No significant turns - just sample evenly
    return sampleEvenly(coordinates, maxWaypoints);
  }

  if (turnIndices.length <= maxWaypoints) {
    // Few enough turns - use all turns + fill remaining with even distribution
    const remainingSlots = maxWaypoints - turnIndices.length;

    // Get turn points
    const turnPoints = turnIndices.map(i => coordinates[i] as [number, number]);

    // Fill remaining slots with evenly distributed points
    if (remainingSlots > 0) {
      const fillerPoints = sampleEvenly(
        coordinates.filter((_, i) => !turnIndices.includes(i)),
        remainingSlots
      );

      // Combine and sort by original order
      const allPoints = [...turnPoints, ...fillerPoints];
      return allPoints.sort((a, b) => {
        const indexA = coordinates.findIndex(c => c[0] === a[0] && c[1] === a[1]);
        const indexB = coordinates.findIndex(c => c[0] === b[0] && c[1] === b[1]);
        return indexA - indexB;
      });
    }

    return turnPoints;
  }

  // Too many turns - prioritize the sharpest ones
  // Calculate angle change for each turn
  const turnAngles = turnIndices.map(i => {
    const prev = coordinates[i - 1] as [number, number];
    const current = coordinates[i] as [number, number];
    const next = coordinates[i + 1] as [number, number];

    const bearing1 = calculateBearing(prev, current);
    const bearing2 = calculateBearing(current, next);

    let angleChange = Math.abs(bearing2 - bearing1);
    if (angleChange > 180) {
      angleChange = 360 - angleChange;
    }

    return { index: i, angle: angleChange };
  });

  // Sort by angle change (sharpest first) and take top maxWaypoints
  const sharpestTurns = turnAngles
    .sort((a, b) => b.angle - a.angle)
    .slice(0, maxWaypoints)
    .sort((a, b) => a.index - b.index); // Re-sort by original order

  return sharpestTurns.map(t => coordinates[t.index] as [number, number]);
}

/**
 * Sample points evenly from coordinates array
 * @param coordinates Array of coordinate points
 * @param count Number of points to sample
 * @returns Evenly sampled points
 */
function sampleEvenly(
  coordinates: number[][],
  count: number
): Array<[number, number]> {
  if (coordinates.length <= count) {
    return coordinates.map(c => [c[0], c[1]] as [number, number]);
  }

  const step = coordinates.length / count;
  const sampled: Array<[number, number]> = [];

  for (let i = 0; i < count; i++) {
    const index = Math.floor(i * step);
    const coord = coordinates[index];
    sampled.push([coord[0], coord[1]]);
  }

  return sampled;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Debug helper: Log waypoint sampling statistics
 */
export function logWaypointStats(
  originalCount: number,
  sampledCount: number,
  turnCount: number
): void {
  console.log('[RouteUtils] Waypoint Sampling Stats:');
  console.log(`  Original points: ${originalCount}`);
  console.log(`  Sampled waypoints: ${sampledCount}`);
  console.log(`  Significant turns found: ${turnCount}`);
  console.log(`  Compression ratio: ${(originalCount / sampledCount).toFixed(1)}:1`);
}
