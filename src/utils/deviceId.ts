import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@test_routes_expert:device_id';

let cachedDeviceId: string | null = null;

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    const storedId = await AsyncStorage.getItem(DEVICE_ID_KEY);

    if (storedId) {
      cachedDeviceId = storedId;
      return storedId;
    }

    const newId = generateUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
    cachedDeviceId = newId;
    return newId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback to temporary ID for this session
    const tempId = generateUUID();
    cachedDeviceId = tempId;
    return tempId;
  }
}

// Test helper to reset cached ID (exported for testing only)
export function __resetCachedDeviceId(): void {
  cachedDeviceId = null;
}
