# Offline Maps & Speed Limit Warnings

## Features

1. **Speed Limit Warnings** - Alerts when exceeding speed limits
2. **Automatic Map Caching** - Maps cached automatically during navigation

---

## 1. Speed Limit Warnings

### How It Works

- Speed limit data is captured when processing routes
- During navigation, your current GPS speed is compared to the road's speed limit
- Visual warnings trigger when you exceed the limit by 5%

### What Was Changed

#### Route Processing Script
**File:** `scripts/process_routes.js`

Added `&annotations=maxspeed,speed,duration` to the Mapbox Map Matching API URL. This returns:
- `maxspeed` - Speed limit for each road segment
- `speed` - Expected speed for each segment
- `duration` - Time for each segment

#### Speed Limit Component
**File:** `src/components/SpeedLimitDisplay.tsx`

Features:
- UK-style circular speed limit sign (red ring, white background)
- Real-time speed display from GPS
- Pulse animation when exceeding limit
- "SLOW DOWN" warning banner
- Automatic unit conversion (km/h from API to mph for UK display)

#### NavigationView Updates
**File:** `src/components/NavigationView.tsx`

- Integrated SpeedLimitDisplay component
- Added speed tracking state
- Warning banner changes from orange to red when speeding
- Speed limit extracted from route annotations

### Usage

Speed limit warnings work automatically during navigation. The display shows:
- **Red circle**: Current speed limit (e.g., "30" mph)
- **Below**: Your current speed
- **Warning**: Flashes red when exceeding limit

### Note on Data Coverage

Not all UK roads have speed limit data in Mapbox. When a segment has `"unknown": true`, the system uses the last known speed limit. For local roads, you may see gaps.

---

## 2. Offline Map Caching

### How It Works

The `@pawan-pk/react-native-mapbox-navigation` package automatically caches map tiles during navigation:

1. **First navigation** - Tiles are downloaded as you navigate
2. **Subsequent navigations** - Cached tiles are used automatically
3. **No manual download needed** - The app handles caching transparently

### Benefits

- Simple - no user action required
- Efficient - only caches roads you actually use
- Automatic - tiles update when navigating with connectivity

### Offline Usage

Once you've navigated a route with internet connectivity:
1. Map tiles for that route are cached locally
2. Future navigations on those roads work offline
3. Turn-by-turn directions work without internet

### Tips for Best Offline Experience

1. **Drive each route once with internet** - This caches the tiles
2. **Common roads cache automatically** - Main roads between test centers get cached naturally
3. **Practice runs help** - A practice run with data ensures tiles are cached for test day

---

## New Routes Need Reprocessing

**Important:** Existing routes in your database may not have speed limit data. To add speed limits to existing routes, you need to reprocess them.

### Option 1: Process New Routes Only
New routes processed with `process_routes.js` will automatically include speed limit data.

### Option 2: Reprocess Existing Routes
If you want speed limits on existing routes, re-run the batch processing:

```bash
cd DTERoutes/scripts
node batch_process_routes.js
```

This will update routes with the new annotation data.

---

## Files

### Components
- `src/components/SpeedLimitDisplay.tsx` - Speed limit UI component

### Modified Files
- `scripts/process_routes.js` - Added annotations parameter
- `src/components/NavigationView.tsx` - Integrated speed limit display
- `src/screens/NavigationScreen.tsx` - Pass annotations to NavigationView

---

## Testing

### Speed Limit Warnings
1. Start navigation on a route
2. GPS speed will be tracked automatically
3. If you exceed the speed limit by 5%, warning triggers
4. Banner turns red and "SLOW DOWN" appears

### Offline Maps
1. Navigate a route with internet connectivity
2. Turn off WiFi/data
3. Navigate the same route again - should work offline

---

## Known Limitations

1. **Speed limit data gaps** - Not all UK roads have speed limits in Mapbox data
2. **Cache on first use** - Must navigate a route online before offline use
3. **GPS accuracy** - Speed readings depend on device GPS quality

