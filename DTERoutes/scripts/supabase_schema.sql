-- ============================================
-- Test Routes Expert - Supabase Database Schema
-- ============================================
-- Run this in the Supabase SQL Editor at:
-- https://zpfkvhnfbbimsfghmjiz.supabase.co
-- ============================================

-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- Test Centers Table
-- ============================================
CREATE TABLE IF NOT EXISTS test_centers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postcode TEXT,
  location GEOGRAPHY(POINT, 4326),
  route_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Routes Table
-- ============================================
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_center_id TEXT REFERENCES test_centers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  route_number INTEGER,
  geometry GEOGRAPHY(LINESTRING, 4326),
  distance_km FLOAT,
  estimated_duration_mins INTEGER,
  difficulty TEXT CHECK (difficulty IN ('easy', 'moderate', 'challenging')),
  point_count INTEGER,
  geojson JSONB NOT NULL,
  mapbox_route JSONB,
  is_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(test_center_id, route_number)
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_test_centers_location
  ON test_centers USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_routes_geometry
  ON routes USING GIST (geometry);

CREATE INDEX IF NOT EXISTS idx_routes_test_center
  ON routes(test_center_id);

CREATE INDEX IF NOT EXISTS idx_routes_processed
  ON routes(is_processed);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================
-- Enable RLS on both tables
ALTER TABLE test_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

-- Allow public read access (MVP - no auth required)
CREATE POLICY IF NOT EXISTS "Allow public read access to test_centers"
  ON test_centers FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow public read access to routes"
  ON routes FOR SELECT USING (true);

-- ============================================
-- Seed Initial Test Center
-- ============================================
INSERT INTO test_centers (id, name, address, city, postcode, location, route_count)
VALUES (
  'stoke-on-trent-newcastle-under-lyme',
  'Stoke-on-Trent (Newcastle-Under-Lyme) Driving Test Centre',
  'Test Centre Address',
  'Stoke-on-Trent',
  'ST5 XXX',
  ST_SetSRID(ST_MakePoint(-2.21258, 52.99598), 4326)::geography,
  1
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Verification Queries
-- ============================================
-- Uncomment these to verify the setup:
-- SELECT * FROM test_centers;
-- SELECT COUNT(*) FROM routes;
-- SELECT postgis_version();
