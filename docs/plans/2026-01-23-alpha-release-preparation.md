# Alpha Release Preparation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prepare the app for Open Test (Alpha) release with user expectation management, hot spot data collection, and internal feedback interception.

**Architecture:** Four interconnected features - (1) AsyncStorage-gated welcome modal, (2) Supabase-backed route request voting with Slack webhook, (3) Supabase feedback form with multiple entry points, (4) UI badges/banners for transparency. All follow existing Zustand + Supabase patterns.

**Tech Stack:** React Native, TypeScript, Zustand, Supabase (tables + Edge Functions), AsyncStorage, existing theme patterns.

---

## Phase 1: Foundation - Supabase Tables & Types

### Task 1: Create route_requests Supabase Table

**Files:**
- Create: Supabase migration (via Supabase Dashboard or CLI)

**Step 1: Create the table via Supabase SQL Editor**

Run this SQL in Supabase Dashboard > SQL Editor:

```sql
-- Route requests table for "Hot Spot" tracking
CREATE TABLE route_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_center_id UUID NOT NULL REFERENCES test_centers(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Prevent duplicate votes from same device per test center
  UNIQUE(test_center_id, device_id)
);

-- Enable RLS
ALTER TABLE route_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for non-authenticated users)
CREATE POLICY "Allow anonymous inserts" ON route_requests
  FOR INSERT WITH CHECK (true);

-- Allow reading own requests
CREATE POLICY "Allow reading all requests" ON route_requests
  FOR SELECT USING (true);

-- Index for aggregation queries
CREATE INDEX idx_route_requests_test_center ON route_requests(test_center_id);
```

**Step 2: Verify table creation**

Run: `SELECT * FROM route_requests LIMIT 1;`
Expected: Empty result, no errors

**Step 3: Commit (documentation only)**

```bash
git add docs/plans/
git commit -m "docs: add alpha release implementation plan"
```

---

### Task 2: Create user_feedback Supabase Table

**Files:**
- Create: Supabase migration (via Dashboard)

**Step 1: Create the table via Supabase SQL Editor**

```sql
-- User feedback table for internal issue collection
CREATE TABLE user_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug', 'missing_content', 'suggestion')),
  test_center_name TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts
CREATE POLICY "Allow anonymous inserts" ON user_feedback
  FOR INSERT WITH CHECK (true);

-- Index for querying by type
CREATE INDEX idx_user_feedback_type ON user_feedback(feedback_type);
CREATE INDEX idx_user_feedback_created ON user_feedback(created_at DESC);
```

**Step 2: Verify table creation**

Run: `SELECT * FROM user_feedback LIMIT 1;`
Expected: Empty result, no errors

---

### Task 3: Add TypeScript Types for New Tables

**Files:**
- Modify: `src/services/supabase.ts:1-50`

**Step 1: Write the type definitions test**

Create: `src/services/__tests__/supabase.types.test.ts`

```typescript
import { RouteRequest, UserFeedback, FeedbackType } from '../supabase';

describe('Supabase Types', () => {
  it('should have correct RouteRequest shape', () => {
    const request: RouteRequest = {
      id: '123',
      test_center_id: '456',
      device_id: 'device-abc',
      user_id: null,
      created_at: '2026-01-23T00:00:00Z',
    };
    expect(request.test_center_id).toBeDefined();
    expect(request.device_id).toBeDefined();
  });

  it('should have correct UserFeedback shape', () => {
    const feedback: UserFeedback = {
      id: '123',
      device_id: 'device-abc',
      feedback_type: 'bug',
      test_center_name: 'Test Center A',
      message: 'Something is broken',
      created_at: '2026-01-23T00:00:00Z',
    };
    expect(feedback.feedback_type).toBe('bug');
  });

  it('should restrict FeedbackType to valid values', () => {
    const validTypes: FeedbackType[] = ['bug', 'missing_content', 'suggestion'];
    expect(validTypes).toHaveLength(3);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/services/__tests__/supabase.types.test.ts`
Expected: FAIL - types not exported

**Step 3: Add types to supabase.ts**

Modify: `src/services/supabase.ts` - Add after existing interfaces:

```typescript
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
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/services/__tests__/supabase.types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/supabase.ts src/services/__tests__/
git commit -m "feat: add RouteRequest and UserFeedback types"
```

---

### Task 4: Add Supabase API Functions for New Tables

**Files:**
- Modify: `src/services/supabase.ts:100-150`
- Test: `src/services/__tests__/supabase.api.test.ts`

**Step 1: Write failing tests for API functions**

Create: `src/services/__tests__/supabase.api.test.ts`

```typescript
import {
  submitRouteRequest,
  hasRequestedRoutes,
  getRouteRequestCount,
  submitFeedback,
} from '../supabase';

// Mock supabase client
jest.mock('../supabase', () => {
  const actual = jest.requireActual('../supabase');
  return {
    ...actual,
    supabase: {
      from: jest.fn(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    },
  };
});

describe('Route Request API', () => {
  it('submitRouteRequest should return success on valid input', async () => {
    const result = await submitRouteRequest('center-123', 'device-abc');
    expect(result).toHaveProperty('success');
  });

  it('hasRequestedRoutes should return boolean', async () => {
    const result = await hasRequestedRoutes('center-123', 'device-abc');
    expect(typeof result).toBe('boolean');
  });

  it('getRouteRequestCount should return number', async () => {
    const result = await getRouteRequestCount('center-123');
    expect(typeof result).toBe('number');
  });
});

describe('Feedback API', () => {
  it('submitFeedback should return success on valid input', async () => {
    const result = await submitFeedback({
      device_id: 'device-abc',
      feedback_type: 'bug',
      test_center_name: 'Test Center A',
      message: 'Something broken',
    });
    expect(result).toHaveProperty('success');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/services/__tests__/supabase.api.test.ts`
Expected: FAIL - functions not defined

**Step 3: Implement API functions**

Add to `src/services/supabase.ts`:

```typescript
// ============ Route Requests API ============

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

// ============ User Feedback API ============

export interface FeedbackInput {
  device_id: string;
  feedback_type: FeedbackType;
  test_center_name: string | null;
  message: string;
}

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
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/services/__tests__/supabase.api.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/supabase.ts src/services/__tests__/
git commit -m "feat: add route request and feedback API functions"
```

---

## Phase 2: Device ID Utility

### Task 5: Create Device ID Utility

**Files:**
- Create: `src/utils/deviceId.ts`
- Test: `src/utils/__tests__/deviceId.test.ts`

**Step 1: Write failing test**

Create: `src/utils/__tests__/deviceId.test.ts`

```typescript
import { getDeviceId } from '../deviceId';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('getDeviceId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return existing device ID from storage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-device-id');

    const deviceId = await getDeviceId();

    expect(deviceId).toBe('existing-device-id');
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('should generate and store new device ID if none exists', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const deviceId = await getDeviceId();

    expect(deviceId).toMatch(/^[a-f0-9-]{36}$/); // UUID format
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@test_routes_expert:device_id',
      expect.any(String)
    );
  });

  it('should return same ID on subsequent calls', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('cached-id');

    const id1 = await getDeviceId();
    const id2 = await getDeviceId();

    expect(id1).toBe(id2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/__tests__/deviceId.test.ts`
Expected: FAIL - module not found

**Step 3: Implement device ID utility**

Create: `src/utils/deviceId.ts`

```typescript
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
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/__tests__/deviceId.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/deviceId.ts src/utils/__tests__/
git commit -m "feat: add device ID utility for anonymous tracking"
```

---

## Phase 3: Alpha Modal Component

### Task 6: Create Alpha Modal Store

**Files:**
- Create: `src/store/useAlphaModalStore.ts`
- Test: `src/store/__tests__/useAlphaModalStore.test.ts`

**Step 1: Write failing test**

Create: `src/store/__tests__/useAlphaModalStore.test.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

// Import after mock
import { useAlphaModalStore } from '../useAlphaModalStore';

describe('useAlphaModalStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAlphaModalStore.getState().reset();
  });

  describe('initialize', () => {
    it('should show modal if not previously dismissed', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await useAlphaModalStore.getState().initialize();

      expect(useAlphaModalStore.getState().shouldShowModal).toBe(true);
      expect(useAlphaModalStore.getState().isInitialized).toBe(true);
    });

    it('should not show modal if previously dismissed', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

      await useAlphaModalStore.getState().initialize();

      expect(useAlphaModalStore.getState().shouldShowModal).toBe(false);
    });
  });

  describe('dismissModal', () => {
    it('should hide modal and persist to storage', async () => {
      useAlphaModalStore.setState({ shouldShowModal: true });

      await useAlphaModalStore.getState().dismissModal();

      expect(useAlphaModalStore.getState().shouldShowModal).toBe(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@test_routes_expert:alpha_modal_dismissed',
        'true'
      );
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/store/__tests__/useAlphaModalStore.test.ts`
Expected: FAIL - module not found

**Step 3: Implement store**

Create: `src/store/useAlphaModalStore.ts`

```typescript
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ALPHA_MODAL_KEY = '@test_routes_expert:alpha_modal_dismissed';

interface AlphaModalState {
  shouldShowModal: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  dismissModal: () => Promise<void>;
  reset: () => void;
}

export const useAlphaModalStore = create<AlphaModalState>((set) => ({
  shouldShowModal: false,
  isInitialized: false,

  initialize: async () => {
    try {
      const dismissed = await AsyncStorage.getItem(ALPHA_MODAL_KEY);
      set({
        shouldShowModal: dismissed !== 'true',
        isInitialized: true,
      });
    } catch (error) {
      console.error('Error initializing alpha modal store:', error);
      set({ shouldShowModal: false, isInitialized: true });
    }
  },

  dismissModal: async () => {
    try {
      await AsyncStorage.setItem(ALPHA_MODAL_KEY, 'true');
      set({ shouldShowModal: false });
    } catch (error) {
      console.error('Error dismissing alpha modal:', error);
      set({ shouldShowModal: false });
    }
  },

  reset: () => {
    set({ shouldShowModal: false, isInitialized: false });
  },
}));
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/store/__tests__/useAlphaModalStore.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/store/useAlphaModalStore.ts src/store/__tests__/
git commit -m "feat: add alpha modal store with persistence"
```

---

### Task 7: Create AlphaWelcomeModal Component

**Files:**
- Create: `src/components/AlphaWelcomeModal.tsx`
- Test: `src/components/__tests__/AlphaWelcomeModal.test.tsx`

**Step 1: Write failing test**

Create: `src/components/__tests__/AlphaWelcomeModal.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AlphaWelcomeModal } from '../AlphaWelcomeModal';

describe('AlphaWelcomeModal', () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when visible', () => {
    const { getByText } = render(
      <AlphaWelcomeModal visible={true} onDismiss={mockOnDismiss} />
    );

    expect(getByText('Welcome to Alpha')).toBeTruthy();
  });

  it('should display all bullet points', () => {
    const { getByText } = render(
      <AlphaWelcomeModal visible={true} onDismiss={mockOnDismiss} />
    );

    expect(getByText(/active development/i)).toBeTruthy();
    expect(getByText(/1 free route/i)).toBeTruthy();
    expect(getByText(/user demand and feedback/i)).toBeTruthy();
  });

  it('should call onDismiss when button pressed', () => {
    const { getByText } = render(
      <AlphaWelcomeModal visible={true} onDismiss={mockOnDismiss} />
    );

    fireEvent.press(getByText('I Understand'));

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <AlphaWelcomeModal visible={false} onDismiss={mockOnDismiss} />
    );

    expect(queryByText('Welcome to Alpha')).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/AlphaWelcomeModal.test.tsx`
Expected: FAIL - module not found

**Step 3: Implement component**

Create: `src/components/AlphaWelcomeModal.tsx`

```typescript
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

interface AlphaWelcomeModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function AlphaWelcomeModal({
  visible,
  onDismiss,
}: AlphaWelcomeModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ALPHA VERSION</Text>
          </View>

          <Text style={styles.title}>Welcome to Alpha</Text>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>1.</Text>
              <Text style={styles.bulletText}>
                We are currently in active development.
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>2.</Text>
              <Text style={styles.bulletText}>
                Most test centers currently have 1 free route.
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>3.</Text>
              <Text style={styles.bulletText}>
                Full route packs are being deployed based on user demand and
                feedback.
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>I Understand</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: Math.min(width - 40, 360),
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    color: '#d97706',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  bulletList: {
    width: '100%',
    marginBottom: 24,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingRight: 8,
  },
  bulletDot: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
    width: 24,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/AlphaWelcomeModal.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/AlphaWelcomeModal.tsx src/components/__tests__/
git commit -m "feat: add AlphaWelcomeModal component"
```

---

### Task 8: Integrate AlphaWelcomeModal in App.tsx

**Files:**
- Modify: `App.tsx`

**Step 1: Read current App.tsx**

Read: `App.tsx` to understand current structure.

**Step 2: Add modal integration**

Modify `App.tsx` to:

```typescript
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initializeRevenueCat } from './src/services/revenuecat';
import { useSubscriptionStore } from './src/store/useSubscriptionStore';
import { useAlphaModalStore } from './src/store/useAlphaModalStore';
import { AlphaWelcomeModal } from './src/components/AlphaWelcomeModal';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const { shouldShowModal, dismissModal } = useAlphaModalStore();
  const initializeAlphaModal = useAlphaModalStore((state) => state.initialize);

  useEffect(() => {
    async function initialize() {
      try {
        await initializeRevenueCat();
        await useSubscriptionStore.getState().initialize();
        await initializeAlphaModal();
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    }

    initialize();
  }, []);

  if (isInitializing) {
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      <AppNavigator />
      <AlphaWelcomeModal visible={shouldShowModal} onDismiss={dismissModal} />
    </NavigationContainer>
  );
}
```

**Step 3: Manual test**

Run: `npm run android` or `npm run ios`
Expected: Alpha modal appears on first launch, dismisses on button press, does not reappear.

**Step 4: Commit**

```bash
git add App.tsx
git commit -m "feat: integrate alpha welcome modal on first launch"
```

---

## Phase 4: Route Request Component

### Task 9: Create RouteRequestCard Component

**Files:**
- Create: `src/components/RouteRequestCard.tsx`
- Test: `src/components/__tests__/RouteRequestCard.test.tsx`

**Step 1: Write failing test**

Create: `src/components/__tests__/RouteRequestCard.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RouteRequestCard } from '../RouteRequestCard';

jest.mock('../../services/supabase', () => ({
  submitRouteRequest: jest.fn(),
  hasRequestedRoutes: jest.fn(),
  getRouteRequestCount: jest.fn(),
}));

jest.mock('../../utils/deviceId', () => ({
  getDeviceId: jest.fn().mockResolvedValue('test-device-id'),
}));

import {
  submitRouteRequest,
  hasRequestedRoutes,
  getRouteRequestCount,
} from '../../services/supabase';

describe('RouteRequestCard', () => {
  const defaultProps = {
    testCenterId: 'center-123',
    testCenterName: 'Test Center A',
    routeCount: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (hasRequestedRoutes as jest.Mock).mockResolvedValue(false);
    (getRouteRequestCount as jest.Mock).mockResolvedValue(5);
    (submitRouteRequest as jest.Mock).mockResolvedValue({ success: true });
  });

  it('should render banner for centers with 1 route', async () => {
    const { findByText } = render(<RouteRequestCard {...defaultProps} />);

    expect(await findByText(/Help us grow!/)).toBeTruthy();
  });

  it('should not render for centers with many routes', () => {
    const { queryByText } = render(
      <RouteRequestCard {...defaultProps} routeCount={5} />
    );

    expect(queryByText(/Help us grow!/)).toBeNull();
  });

  it('should show request count', async () => {
    const { findByText } = render(<RouteRequestCard {...defaultProps} />);

    expect(await findByText(/5 requests/)).toBeTruthy();
  });

  it('should submit request on button press', async () => {
    const { findByText } = render(<RouteRequestCard {...defaultProps} />);

    const button = await findByText('Request Full Route Pack');
    fireEvent.press(button);

    await waitFor(() => {
      expect(submitRouteRequest).toHaveBeenCalledWith(
        'center-123',
        'test-device-id'
      );
    });
  });

  it('should show already requested state', async () => {
    (hasRequestedRoutes as jest.Mock).mockResolvedValue(true);

    const { findByText } = render(<RouteRequestCard {...defaultProps} />);

    expect(await findByText(/Requested/)).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/RouteRequestCard.test.tsx`
Expected: FAIL - module not found

**Step 3: Implement component**

Create: `src/components/RouteRequestCard.tsx`

```typescript
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  submitRouteRequest,
  hasRequestedRoutes,
  getRouteRequestCount,
} from '../services/supabase';
import { getDeviceId } from '../utils/deviceId';

interface RouteRequestCardProps {
  testCenterId: string;
  testCenterName: string;
  routeCount: number;
}

export function RouteRequestCard({
  testCenterId,
  testCenterName,
  routeCount,
}: RouteRequestCardProps) {
  const [hasRequested, setHasRequested] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only show for centers with limited routes (1-2)
  const shouldShow = routeCount <= 2;

  useEffect(() => {
    if (!shouldShow) return;

    async function loadData() {
      try {
        const deviceId = await getDeviceId();
        const [alreadyRequested, count] = await Promise.all([
          hasRequestedRoutes(testCenterId, deviceId),
          getRouteRequestCount(testCenterId),
        ]);
        setHasRequested(alreadyRequested);
        setRequestCount(count);
      } catch (error) {
        console.error('Error loading route request data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [testCenterId, shouldShow]);

  const handleRequest = useCallback(async () => {
    if (hasRequested || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const deviceId = await getDeviceId();
      const result = await submitRouteRequest(testCenterId, deviceId);

      if (result.success) {
        setHasRequested(true);
        setRequestCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error submitting route request:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [testCenterId, hasRequested, isSubmitting]);

  if (!shouldShow) return null;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          Help us grow! If this is your local center, request a full pack below
          so we know where to deploy next.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.countContainer}>
          <Text style={styles.countNumber}>{requestCount}</Text>
          <Text style={styles.countLabel}>
            {requestCount === 1 ? 'request' : 'requests'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            hasRequested && styles.buttonDisabled,
          ]}
          onPress={handleRequest}
          disabled={hasRequested || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>
              {hasRequested ? 'Requested ✓' : 'Request Full Route Pack'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  banner: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  bannerText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  countContainer: {
    alignItems: 'center',
  },
  countNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2563eb',
  },
  countLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginLeft: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/RouteRequestCard.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/RouteRequestCard.tsx src/components/__tests__/
git commit -m "feat: add RouteRequestCard component for hot spot tracking"
```

---

### Task 10: Integrate RouteRequestCard in TestCenterScreen

**Files:**
- Modify: `src/screens/TestCenterScreen.tsx`

**Step 1: Read current TestCenterScreen**

Read: `src/screens/TestCenterScreen.tsx`

**Step 2: Add RouteRequestCard import and usage**

Add import at top:
```typescript
import { RouteRequestCard } from '../components/RouteRequestCard';
```

Add component after header, before routes list (in the render):
```typescript
<RouteRequestCard
  testCenterId={testCenterId}
  testCenterName={testCenterName}
  routeCount={routes.length}
/>
```

**Step 3: Manual test**

Run: `npm run android`
Navigate to a test center with 1 route.
Expected: Banner and request button appear, request submits successfully.

**Step 4: Commit**

```bash
git add src/screens/TestCenterScreen.tsx
git commit -m "feat: integrate route request card in TestCenterScreen"
```

---

## Phase 5: Feedback System

### Task 11: Create FeedbackScreen

**Files:**
- Create: `src/screens/FeedbackScreen.tsx`
- Test: `src/screens/__tests__/FeedbackScreen.test.tsx`

**Step 1: Write failing test**

Create: `src/screens/__tests__/FeedbackScreen.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { FeedbackScreen } from '../FeedbackScreen';

jest.mock('../../services/supabase', () => ({
  submitFeedback: jest.fn(),
}));

jest.mock('../../utils/deviceId', () => ({
  getDeviceId: jest.fn().mockResolvedValue('test-device-id'),
}));

const mockNavigation = {
  goBack: jest.fn(),
};

const mockRoute = {
  params: {},
};

import { submitFeedback } from '../../services/supabase';

describe('FeedbackScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (submitFeedback as jest.Mock).mockResolvedValue({ success: true });
  });

  it('should render feedback type selector', () => {
    const { getByText } = render(
      <FeedbackScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    expect(getByText('Bug')).toBeTruthy();
    expect(getByText('Missing Content')).toBeTruthy();
    expect(getByText('Suggestion')).toBeTruthy();
  });

  it('should auto-fill test center name from route params', () => {
    const routeWithCenter = {
      params: { testCenterName: 'Test Center A' },
    };

    const { getByDisplayValue } = render(
      <FeedbackScreen
        navigation={mockNavigation as any}
        route={routeWithCenter as any}
      />
    );

    expect(getByDisplayValue('Test Center A')).toBeTruthy();
  });

  it('should submit feedback and navigate back on success', async () => {
    const { getByText, getByPlaceholderText } = render(
      <FeedbackScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    fireEvent.press(getByText('Bug'));
    fireEvent.changeText(
      getByPlaceholderText(/Describe your issue/),
      'Something is broken'
    );
    fireEvent.press(getByText('Submit Feedback'));

    await waitFor(() => {
      expect(submitFeedback).toHaveBeenCalledWith({
        device_id: 'test-device-id',
        feedback_type: 'bug',
        test_center_name: null,
        message: 'Something is broken',
      });
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  it('should show error when message is empty', () => {
    const { getByText } = render(
      <FeedbackScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    fireEvent.press(getByText('Bug'));
    fireEvent.press(getByText('Submit Feedback'));

    expect(getByText(/Please enter a message/)).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/screens/__tests__/FeedbackScreen.test.tsx`
Expected: FAIL - module not found

**Step 3: Implement FeedbackScreen**

Create: `src/screens/FeedbackScreen.tsx`

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { submitFeedback, FeedbackType } from '../services/supabase';
import { getDeviceId } from '../utils/deviceId';

type FeedbackScreenProps = NativeStackScreenProps<any, 'Feedback'>;

const FEEDBACK_TYPES: { type: FeedbackType; label: string }[] = [
  { type: 'bug', label: 'Bug' },
  { type: 'missing_content', label: 'Missing Content' },
  { type: 'suggestion', label: 'Suggestion' },
];

export function FeedbackScreen({ navigation, route }: FeedbackScreenProps) {
  const testCenterName = route.params?.testCenterName ?? null;

  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [testCenter, setTestCenter] = useState(testCenterName ?? '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!selectedType) {
      setError('Please select a feedback type');
      return;
    }

    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setIsSubmitting(true);

    try {
      const deviceId = await getDeviceId();
      const result = await submitFeedback({
        device_id: deviceId,
        feedback_type: selectedType,
        test_center_name: testCenter.trim() || null,
        message: message.trim(),
      });

      if (result.success) {
        Alert.alert(
          'Thank You!',
          'Your feedback has been submitted. We appreciate your help improving the app.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        setError(result.error ?? 'Failed to submit feedback. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Feedback Type</Text>
        <View style={styles.typeContainer}>
          {FEEDBACK_TYPES.map(({ type, label }) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                selectedType === type && styles.typeButtonSelected,
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === type && styles.typeButtonTextSelected,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Test Center (Optional)</Text>
        <TextInput
          style={styles.input}
          value={testCenter}
          onChangeText={setTestCenter}
          placeholder="Enter test center name"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.sectionTitle}>Message</Text>
        <TextInput
          style={[styles.input, styles.messageInput]}
          value={message}
          onChangeText={setMessage}
          placeholder="Describe your issue, suggestion, or missing content..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    marginTop: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  typeButtonSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  typeButtonTextSelected: {
    color: '#2563eb',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageInput: {
    height: 150,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/screens/__tests__/FeedbackScreen.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/screens/FeedbackScreen.tsx src/screens/__tests__/
git commit -m "feat: add FeedbackScreen for internal feedback collection"
```

---

### Task 12: Add FeedbackScreen to Navigation

**Files:**
- Modify: `src/navigation/AppNavigator.tsx`

**Step 1: Read current AppNavigator**

Read: `src/navigation/AppNavigator.tsx`

**Step 2: Add Feedback screen to stack**

Add to RootStackParamList:
```typescript
Feedback: { testCenterName?: string };
```

Add import:
```typescript
import { FeedbackScreen } from '../screens/FeedbackScreen';
```

Add screen to Stack.Navigator:
```typescript
<Stack.Screen
  name="Feedback"
  component={FeedbackScreen}
  options={{
    title: 'Send Feedback',
    headerStyle: { backgroundColor: '#2563eb' },
    headerTintColor: '#ffffff',
    headerTitleStyle: { fontWeight: 'bold' },
  }}
/>
```

**Step 3: Commit**

```bash
git add src/navigation/AppNavigator.tsx
git commit -m "feat: add FeedbackScreen to navigation stack"
```

---

### Task 13: Add Feedback Entry Points

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`
- Modify: `src/screens/TestCenterScreen.tsx`

**Step 1: Add "Report an Issue / Suggestion" to SettingsScreen**

Read: `src/screens/SettingsScreen.tsx`

Add in the Support section:
```typescript
<TouchableOpacity
  style={styles.settingsItem}
  onPress={() => navigation.navigate('Feedback')}
>
  <Text style={styles.settingsItemText}>Report an Issue / Suggestion</Text>
</TouchableOpacity>
```

**Step 2: Add "Missing Routes?" to TestCenterScreen**

In TestCenterScreen, add a button after the route list:
```typescript
<TouchableOpacity
  style={styles.missingRoutesButton}
  onPress={() =>
    navigation.navigate('Feedback', { testCenterName })
  }
>
  <Text style={styles.missingRoutesText}>Missing Routes?</Text>
</TouchableOpacity>
```

Add styles:
```typescript
missingRoutesButton: {
  marginHorizontal: 16,
  marginTop: 16,
  marginBottom: 32,
  padding: 12,
  backgroundColor: '#f3f4f6',
  borderRadius: 8,
  alignItems: 'center',
},
missingRoutesText: {
  fontSize: 14,
  color: '#6b7280',
  textDecorationLine: 'underline',
},
```

**Step 3: Manual test**

Run: `npm run android`
Navigate to Settings > Report an Issue
Navigate to Test Center > Missing Routes?
Expected: Both navigate to FeedbackScreen with correct pre-filled data.

**Step 4: Commit**

```bash
git add src/screens/SettingsScreen.tsx src/screens/TestCenterScreen.tsx
git commit -m "feat: add feedback entry points in Settings and TestCenter screens"
```

---

## Phase 6: UI Transparency Adjustments

### Task 14: Add Alpha Badge to HomeScreen Header

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

**Step 1: Read current HomeScreen**

Read: `src/screens/HomeScreen.tsx`

**Step 2: Create AlphaBadge component inline or as header**

Add to header using navigation options in useLayoutEffect or in AppNavigator:

In `AppNavigator.tsx`, modify Home screen options:
```typescript
<Stack.Screen
  name="Home"
  component={HomeScreen}
  options={{
    title: 'Test Centres',
    headerStyle: { backgroundColor: '#2563eb' },
    headerTintColor: '#ffffff',
    headerTitleStyle: { fontWeight: 'bold' },
    headerTitle: () => (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>
          Test Centres
        </Text>
        <View
          style={{
            backgroundColor: '#fef3c7',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
            marginLeft: 8,
          }}
        >
          <Text style={{ color: '#d97706', fontSize: 10, fontWeight: '700' }}>
            ALPHA
          </Text>
        </View>
      </View>
    ),
    // ... rest of options
  }}
/>
```

**Step 3: Manual test**

Run: `npm run android`
Expected: "ALPHA" badge appears in header next to "Test Centres" title.

**Step 4: Commit**

```bash
git add src/navigation/AppNavigator.tsx
git commit -m "feat: add alpha badge to home screen header"
```

---

## Phase 7: Review Suppression Audit

### Task 15: Audit and Remove Store Review Prompts

**Files:**
- Audit: Entire codebase

**Step 1: Search for store review libraries**

Run: `grep -r "store-review\|rate-app\|in-app-review\|StoreReview" --include="*.ts" --include="*.tsx" --include="*.json" .`

Expected: No matches (if clean) or list files to modify.

**Step 2: Check package.json**

Read: `package.json`

Look for:
- `react-native-store-review`
- `react-native-in-app-review`
- `expo-store-review`
- Any rating/review packages

**Step 3: If found, remove**

```bash
npm uninstall <package-name>
```

Remove any import/usage in code.

**Step 4: Document findings**

If no review prompts found, document in commit message.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: audit and confirm no store review prompts active"
```

---

## Phase 8: Supabase Webhook for Slack

### Task 16: Create Supabase Edge Function for Slack Notifications

**Files:**
- Create: `supabase/functions/slack-notify-route-request/index.ts`

**Step 1: Create Edge Function directory**

```bash
mkdir -p supabase/functions/slack-notify-route-request
```

**Step 2: Create Edge Function**

Create: `supabase/functions/slack-notify-route-request/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SLACK_WEBHOOK_URL = Deno.env.get('SLACK_WEBHOOK_URL') ?? '';

interface RouteRequestPayload {
  type: 'INSERT';
  table: 'route_requests';
  record: {
    id: string;
    test_center_id: string;
    device_id: string;
    created_at: string;
  };
}

serve(async (req) => {
  try {
    const payload: RouteRequestPayload = await req.json();

    if (payload.type !== 'INSERT' || payload.table !== 'route_requests') {
      return new Response('Ignored', { status: 200 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch test center name
    const { data: testCenter } = await supabase
      .from('test_centers')
      .select('name, city')
      .eq('id', payload.record.test_center_id)
      .single();

    // Get total request count for this center
    const { count } = await supabase
      .from('route_requests')
      .select('*', { count: 'exact', head: true })
      .eq('test_center_id', payload.record.test_center_id);

    const message = {
      text: `🔥 New Route Pack Request!`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🔥 New Route Pack Request!',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Test Centre:*\n${testCenter?.name ?? 'Unknown'}`,
            },
            {
              type: 'mrkdwn',
              text: `*Location:*\n${testCenter?.city ?? 'Unknown'}`,
            },
            {
              type: 'mrkdwn',
              text: `*Total Requests:*\n${count ?? 1}`,
            },
            {
              type: 'mrkdwn',
              text: `*Time:*\n${new Date(payload.record.created_at).toLocaleString()}`,
            },
          ],
        },
      ],
    };

    const slackResponse = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!slackResponse.ok) {
      throw new Error(`Slack webhook failed: ${slackResponse.status}`);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response('Error', { status: 500 });
  }
});
```

**Step 3: Deploy Edge Function**

```bash
supabase functions deploy slack-notify-route-request --project-ref <your-project-ref>
```

**Step 4: Set secrets**

```bash
supabase secrets set SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL --project-ref <your-project-ref>
```

**Step 5: Create Database Webhook in Supabase Dashboard**

1. Go to Database > Webhooks
2. Create new webhook:
   - Name: `slack-route-request-notify`
   - Table: `route_requests`
   - Events: INSERT
   - URL: Edge Function URL
   - HTTP Headers: `Authorization: Bearer <SUPABASE_ANON_KEY>`

**Step 6: Test webhook**

Insert a test row into `route_requests` table.
Expected: Slack message appears in configured channel.

**Step 7: Commit**

```bash
git add supabase/
git commit -m "feat: add Slack notification Edge Function for route requests"
```

---

## Phase 9: Final Integration Testing

### Task 17: End-to-End Manual Testing

**Test Checklist:**

- [ ] **Alpha Modal**
  - Fresh install shows modal
  - "I Understand" dismisses modal
  - Modal does not reappear on subsequent launches
  - Clear app data, modal reappears

- [ ] **Route Request**
  - Centers with 1 route show request card
  - Request button submits successfully
  - Button changes to "Requested ✓" after submission
  - Duplicate requests are prevented
  - Slack receives notification

- [ ] **Feedback System**
  - Settings > "Report an Issue" navigates to FeedbackScreen
  - TestCenter > "Missing Routes?" navigates with pre-filled center name
  - All feedback types can be selected
  - Form validates empty message
  - Successful submission shows thank you alert
  - Feedback appears in Supabase `user_feedback` table

- [ ] **UI Transparency**
  - Alpha badge visible in HomeScreen header
  - Banner appears on limited route centers

- [ ] **Review Suppression**
  - Verify no Play Store prompts appear anywhere in app

**Step: Run full test suite**

```bash
npm test
```

Expected: All tests pass.

**Step: Build release APK**

```bash
cd android && ./gradlew assembleRelease
```

Expected: Build succeeds.

---

## Summary

| Phase | Tasks | Components |
|-------|-------|------------|
| 1 | Tasks 1-4 | Supabase tables, TypeScript types, API functions |
| 2 | Task 5 | Device ID utility |
| 3 | Tasks 6-8 | Alpha modal store, component, integration |
| 4 | Tasks 9-10 | Route request card, TestCenterScreen integration |
| 5 | Tasks 11-13 | Feedback screen, navigation, entry points |
| 6 | Task 14 | Alpha badge in header |
| 7 | Task 15 | Store review audit |
| 8 | Task 16 | Slack webhook Edge Function |
| 9 | Task 17 | E2E testing |

**Total Tasks:** 17
**Estimated Commits:** 14

---

## Dependencies Between Tasks

```
Task 1 (route_requests table)
    └── Task 4 (API functions)
        └── Task 5 (device ID)
            └── Task 9 (RouteRequestCard)
                └── Task 10 (TestCenterScreen integration)

Task 2 (user_feedback table)
    └── Task 4 (API functions)
        └── Task 5 (device ID)
            └── Task 11 (FeedbackScreen)
                └── Task 12 (Navigation)
                    └── Task 13 (Entry points)

Task 3 (TypeScript types) ← Required by Tasks 4, 9, 11

Task 6 (Alpha modal store)
    └── Task 7 (AlphaWelcomeModal component)
        └── Task 8 (App.tsx integration)

Task 14 (Alpha badge) ← Independent
Task 15 (Review audit) ← Independent
Task 16 (Slack webhook) ← After Task 1
Task 17 (E2E testing) ← After all tasks
```
