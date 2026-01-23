/**
 * Mock for @react-native-async-storage/async-storage
 */

let mockStorage = {};

const mockAsyncStorage = {
  getItem: jest.fn((key) => {
    return Promise.resolve(mockStorage[key] || null);
  }),
  setItem: jest.fn((key, value) => {
    mockStorage[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key) => {
    delete mockStorage[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    mockStorage = {};
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() => {
    return Promise.resolve(Object.keys(mockStorage));
  }),
  multiGet: jest.fn((keys) => {
    return Promise.resolve(keys.map((key) => [key, mockStorage[key] || null]));
  }),
  multiSet: jest.fn((keyValuePairs) => {
    keyValuePairs.forEach(([key, value]) => {
      mockStorage[key] = value;
    });
    return Promise.resolve();
  }),
  multiRemove: jest.fn((keys) => {
    keys.forEach((key) => {
      delete mockStorage[key];
    });
    return Promise.resolve();
  }),
  // Helper for tests to reset the mock storage
  __resetMockStorage: () => {
    mockStorage = {};
  },
  // Helper for tests to set mock storage directly
  __setMockStorage: (storage) => {
    mockStorage = { ...storage };
  },
  // Helper to get current mock storage state
  __getMockStorage: () => ({ ...mockStorage }),
};

export default mockAsyncStorage;
