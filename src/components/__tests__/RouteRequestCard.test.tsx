/**
 * RouteRequestCard Tests
 * ======================
 * Tests for the Route Request Card component used for "Hot Spot" tracking
 */

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { RouteRequestCard } from '../RouteRequestCard';

// Mock the supabase service
jest.mock('../../services/supabase', () => ({
  submitRouteRequest: jest.fn(),
  hasRequestedRoutes: jest.fn(),
  getRouteRequestCount: jest.fn(),
}));

// Mock the deviceId utility
jest.mock('../../utils/deviceId', () => ({
  getDeviceId: jest.fn(),
}));

import {
  submitRouteRequest,
  hasRequestedRoutes,
  getRouteRequestCount,
} from '../../services/supabase';
import { getDeviceId } from '../../utils/deviceId';

const mockSubmitRouteRequest = submitRouteRequest as jest.MockedFunction<
  typeof submitRouteRequest
>;
const mockHasRequestedRoutes = hasRequestedRoutes as jest.MockedFunction<
  typeof hasRequestedRoutes
>;
const mockGetRouteRequestCount = getRouteRequestCount as jest.MockedFunction<
  typeof getRouteRequestCount
>;
const mockGetDeviceId = getDeviceId as jest.MockedFunction<typeof getDeviceId>;

describe('RouteRequestCard', () => {
  const defaultProps = {
    testCenterId: 'test-center-123',
    testCenterName: 'Test Center London',
    routeCount: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDeviceId.mockResolvedValue('device-123');
    mockHasRequestedRoutes.mockResolvedValue(false);
    mockGetRouteRequestCount.mockResolvedValue(5);
    mockSubmitRouteRequest.mockResolvedValue({ success: true });
  });

  describe('render conditions', () => {
    it('renders for centers with 1 route', async () => {
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(<RouteRequestCard {...defaultProps} routeCount={1} />);
        // Wait for useEffect to complete
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(tree!.toJSON()).not.toBeNull();
    });

    it('renders for centers with 2 routes', async () => {
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(<RouteRequestCard {...defaultProps} routeCount={2} />);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(tree!.toJSON()).not.toBeNull();
    });

    it('does not render for centers with 3 or more routes', async () => {
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(<RouteRequestCard {...defaultProps} routeCount={3} />);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(tree!.toJSON()).toBeNull();
    });

    it('does not render for centers with 5+ routes', async () => {
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(<RouteRequestCard {...defaultProps} routeCount={5} />);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(tree!.toJSON()).toBeNull();
    });
  });

  describe('content display', () => {
    it('displays the "Help us grow!" banner text', async () => {
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(<RouteRequestCard {...defaultProps} />);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const rootInstance = tree!.root;
      const textElements = rootInstance.findAllByType('Text');
      const bannerText = textElements.find(
        (el) => el.props.children === 'Help us grow!'
      );

      expect(bannerText).toBeDefined();
    });

    it('displays the informational message about requesting routes', async () => {
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(<RouteRequestCard {...defaultProps} />);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const rootInstance = tree!.root;
      const textElements = rootInstance.findAllByType('Text');
      const messageText = textElements.find((el) =>
        String(el.props.children).includes('local center')
      );

      expect(messageText).toBeDefined();
    });

    it('shows the request count', async () => {
      mockGetRouteRequestCount.mockResolvedValue(12);

      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(<RouteRequestCard {...defaultProps} />);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const rootInstance = tree!.root;
      const textElements = rootInstance.findAllByType('Text');
      const countText = textElements.find((el) => el.props.children === '12');

      expect(countText).toBeDefined();
    });

    it('displays "Request Full Route Pack" button', async () => {
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(<RouteRequestCard {...defaultProps} />);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const rootInstance = tree!.root;
      const textElements = rootInstance.findAllByType('Text');
      const buttonText = textElements.find(
        (el) => el.props.children === 'Request Full Route Pack'
      );

      expect(buttonText).toBeDefined();
    });
  });

  describe('loading state', () => {
    it('shows loading spinner while loading data', async () => {
      // Make the API calls hang
      mockHasRequestedRoutes.mockImplementation(
        () => new Promise(() => {})
      );

      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(<RouteRequestCard {...defaultProps} />);
      });

      const rootInstance = tree!.root;
      const activityIndicators = rootInstance.findAllByType('ActivityIndicator');

      expect(activityIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('request submission', () => {
    it('submits request on button press', async () => {
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(<RouteRequestCard {...defaultProps} />);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const rootInstance = tree!.root;
      const touchables = rootInstance.findAll(
        (node) =>
          node.props.onPress !== undefined &&
          node.props.accessibilityRole !== 'text'
      );

      const button = touchables.find((t) => {
        try {
          const textElements = t.findAllByType('Text');
          return textElements.some(
            (text) => text.props.children === 'Request Full Route Pack'
          );
        } catch {
          return false;
        }
      });

      expect(button).toBeDefined();

      await act(async () => {
        button!.props.onPress();
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockSubmitRouteRequest).toHaveBeenCalledWith(
        'test-center-123',
        'device-123'
      );
    });

    it('disables button after successful request', async () => {
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(<RouteRequestCard {...defaultProps} />);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const rootInstance = tree!.root;
      const touchables = rootInstance.findAll(
        (node) =>
          node.props.onPress !== undefined &&
          node.props.accessibilityRole !== 'text'
      );

      const button = touchables.find((t) => {
        try {
          const textElements = t.findAllByType('Text');
          return textElements.some(
            (text) => text.props.children === 'Request Full Route Pack'
          );
        } catch {
          return false;
        }
      });

      await act(async () => {
        button!.props.onPress();
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // After submitting, look for the "Requested" text
      const textElements = rootInstance.findAllByType('Text');
      const requestedText = textElements.find((el) =>
        String(el.props.children).includes('Requested')
      );

      expect(requestedText).toBeDefined();
    });
  });

  describe('already requested state', () => {
    it('shows "Requested" state when user has already requested', async () => {
      mockHasRequestedRoutes.mockResolvedValue(true);

      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(<RouteRequestCard {...defaultProps} />);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const rootInstance = tree!.root;
      const textElements = rootInstance.findAllByType('Text');
      const requestedText = textElements.find((el) =>
        String(el.props.children).includes('Requested')
      );

      expect(requestedText).toBeDefined();
    });

    it('does not show "Request Full Route Pack" button when already requested', async () => {
      mockHasRequestedRoutes.mockResolvedValue(true);

      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(<RouteRequestCard {...defaultProps} />);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const rootInstance = tree!.root;
      const textElements = rootInstance.findAllByType('Text');
      const buttonText = textElements.find(
        (el) => el.props.children === 'Request Full Route Pack'
      );

      expect(buttonText).toBeUndefined();
    });
  });

  describe('data loading', () => {
    it('calls getDeviceId on mount', async () => {
      await act(async () => {
        renderer.create(<RouteRequestCard {...defaultProps} />);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockGetDeviceId).toHaveBeenCalled();
    });

    it('calls hasRequestedRoutes with correct parameters', async () => {
      await act(async () => {
        renderer.create(<RouteRequestCard {...defaultProps} />);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockHasRequestedRoutes).toHaveBeenCalledWith(
        'test-center-123',
        'device-123'
      );
    });

    it('calls getRouteRequestCount with correct testCenterId', async () => {
      await act(async () => {
        renderer.create(<RouteRequestCard {...defaultProps} />);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockGetRouteRequestCount).toHaveBeenCalledWith('test-center-123');
    });
  });
});
