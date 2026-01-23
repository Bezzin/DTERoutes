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

// ============================================
// Route Requests API
// ============================================

/**
 * Submit a route request for a test center
 * Returns success/error status (handles duplicates gracefully)
 */
export async function submitRouteRequest(
  testCenterId: string,
  deviceId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('route_requests')
    .insert({
      test_center_id: testCenterId,
      device_id: deviceId,
    });

  if (error) {
    // Handle duplicate constraint violation gracefully
    if (error.code === '23505') {
      return { success: false, error: 'Already requested' };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Check if a device has already requested routes for a test center
 */
export async function hasRequestedRoutes(
  testCenterId: string,
  deviceId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('route_requests')
    .select('id')
    .eq('test_center_id', testCenterId)
    .eq('device_id', deviceId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking route request:', error);
  }

  return !!data;
}

/**
 * Get the number of route requests for a test center
 */
export async function getRouteRequestCount(
  testCenterId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('route_requests')
    .select('*', { count: 'exact', head: true })
    .eq('test_center_id', testCenterId);

  if (error) {
    console.error('Error getting route request count:', error);
    return 0;
  }

  return count ?? 0;
}

// ============================================
// User Feedback API
// ============================================

/**
 * Input type for submitting user feedback
 */
export interface FeedbackInput {
  device_id: string;
  feedback_type: FeedbackType;
  test_center_name: string | null;
  message: string;
}

/**
 * Submit user feedback
 */
export async function submitFeedback(
  feedback: FeedbackInput
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('user_feedback')
    .insert(feedback);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
