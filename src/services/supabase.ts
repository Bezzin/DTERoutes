/**
 * Supabase Client Service
 * ========================
 * Handles all database operations for test centers and routes
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import 'react-native-url-polyfill/auto';

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================
// Type Definitions
// ============================================

export interface TestCenter {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postcode: string | null;
  route_count: number;
  created_at: string;
}

export interface Route {
  id: string;
  test_center_id: string;
  name: string;
  route_number: number;
  distance_km: number;
  estimated_duration_mins: number;
  difficulty: 'easy' | 'moderate' | 'challenging';
  point_count: number;
  geojson: any; // GeoJSON FeatureCollection
  mapbox_route: any; // Mapbox Map Matching response
  is_processed: boolean;
  created_at: string;
}

export interface RouteWithTestCenter extends Route {
  test_center: TestCenter;
}

// Feedback types
export type FeedbackType = 'bug' | 'missing_content' | 'suggestion';

// Route request for "Hot Spot" tracking
export interface RouteRequest {
  id: string;
  test_center_id: string;
  device_id: string;
  user_id: string | null;
  created_at: string;
}

// User feedback for internal issue collection
export interface UserFeedback {
  id: string;
  device_id: string;
  feedback_type: FeedbackType;
  test_center_name: string | null;
  message: string;
  created_at: string;
}

// ============================================
// Test Centers API
// ============================================

/**
 * Fetch all test centers, sorted by name
 */
export async function fetchTestCenters(): Promise<TestCenter[]> {
  const { data, error } = await supabase
    .from('test_centers')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching test centers:', error);
    throw error;
  }

  return data as TestCenter[];
}

/**
 * Fetch a single test center by ID
 */
export async function fetchTestCenterById(id: string): Promise<TestCenter> {
  const { data, error } = await supabase
    .from('test_centers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching test center:', error);
    throw error;
  }

  return data as TestCenter;
}

// ============================================
// Routes API
// ============================================

/**
 * Fetch all processed routes for a specific test center
 */
export async function fetchRoutesByTestCenter(
  testCenterId: string
): Promise<Route[]> {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('test_center_id', testCenterId)
    .eq('is_processed', true)
    .order('route_number');

  if (error) {
    console.error('Error fetching routes:', error);
    throw error;
  }

  return data as Route[];
}

/**
 * Fetch a single route by ID
 */
export async function fetchRouteById(id: string): Promise<Route> {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('id', id)
    .eq('is_processed', true)
    .single();

  if (error) {
    console.error('Error fetching route:', error);
    throw error;
  }

  return data as Route;
}

/**
 * Fetch route with its test center information
 */
export async function fetchRouteWithTestCenter(
  id: string
): Promise<RouteWithTestCenter> {
  const { data, error } = await supabase
    .from('routes')
    .select(`
      *,
      test_center:test_centers(*)
    `)
    .eq('id', id)
    .eq('is_processed', true)
    .single();

  if (error) {
    console.error('Error fetching route with test center:', error);
    throw error;
  }

  return data as RouteWithTestCenter;
}

/**
 * Fetch all processed routes (useful for search/browsing)
 */
export async function fetchAllRoutes(): Promise<RouteWithTestCenter[]> {
  const { data, error } = await supabase
    .from('routes')
    .select(`
      *,
      test_center:test_centers(*)
    `)
    .eq('is_processed', true)
    .order('test_center_id')
    .order('route_number');

  if (error) {
    console.error('Error fetching all routes:', error);
    throw error;
  }

  return data as RouteWithTestCenter[];
}

// ============================================
// Utility Functions
// ============================================

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('test_centers').select('count');
    return !error;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Get statistics
 */
export async function getStats() {
  const [centersResult, routesResult] = await Promise.all([
    supabase.from('test_centers').select('count'),
    supabase.from('routes').select('count').eq('is_processed', true),
  ]);

  return {
    testCenters: centersResult.count || 0,
    routes: routesResult.count || 0,
  };
}
