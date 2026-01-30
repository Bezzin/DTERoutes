/**
 * Mock for @supabase/supabase-js
 */
const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();

const mockSupabaseClient = {
  from: mockFrom,
};

module.exports = {
  createClient: jest.fn(() => mockSupabaseClient),
  mockInsert,
  mockSelect,
  mockFrom,
};
