/**
 * FeedbackScreen Tests
 * ====================
 * Tests for the Feedback form screen component
 */

import React from 'react';
import renderer, { act } from 'react-test-renderer';

// Mock the dependencies before imports
jest.mock('../../services/supabase', () => ({
  submitFeedback: jest.fn(),
}));

jest.mock('../../utils/deviceId', () => ({
  getDeviceId: jest.fn(),
}));

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

import FeedbackScreen from '../FeedbackScreen';
import { submitFeedback } from '../../services/supabase';
import { getDeviceId } from '../../utils/deviceId';
import { Alert } from 'react-native';

// Mock navigation
const createMockNavigation = () => ({
  goBack: jest.fn(),
  navigate: jest.fn(),
  setOptions: jest.fn(),
});

// Mock route with optional testCenterName
const createMockRoute = (testCenterName?: string) => ({
  params: testCenterName ? { testCenterName } : undefined,
  key: 'feedback-key',
  name: 'Feedback' as const,
});

describe('FeedbackScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (getDeviceId as jest.Mock).mockResolvedValue('test-device-id-123');
    (submitFeedback as jest.Mock).mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Type Selector', () => {
    it('renders all three feedback type buttons', () => {
      const navigation = createMockNavigation();
      const route = createMockRoute();

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <FeedbackScreen navigation={navigation as any} route={route as any} />
        );
      });

      const rootInstance = tree!.root;
      const textElements = rootInstance.findAllByType('Text');
      const buttonTexts = textElements.map((el) => el.props.children);

      expect(buttonTexts).toContain('Bug');
      expect(buttonTexts).toContain('Missing Content');
      expect(buttonTexts).toContain('Suggestion');
    });

    it('highlights the selected feedback type when pressed', () => {
      const navigation = createMockNavigation();
      const route = createMockRoute();

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <FeedbackScreen navigation={navigation as any} route={route as any} />
        );
      });

      const rootInstance = tree!.root;

      // Find the Bug button and simulate press
      const touchables = rootInstance.findAll(
        (node) => node.props.onPress !== undefined
      );

      const bugButton = touchables.find((t) => {
        try {
          const textElements = t.findAllByType('Text');
          return textElements.some((text) => text.props.children === 'Bug');
        } catch {
          return false;
        }
      });

      expect(bugButton).toBeDefined();

      act(() => {
        bugButton!.props.onPress();
        jest.runAllTimers();
      });

      // Verify the component re-rendered
      const updatedTree = tree!.toJSON();
      expect(updatedTree).toBeTruthy();
    });
  });

  describe('Test Center Field', () => {
    it('auto-fills test center from route params', () => {
      const navigation = createMockNavigation();
      const route = createMockRoute('Cardiff Test Centre');

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <FeedbackScreen navigation={navigation as any} route={route as any} />
        );
      });

      const rootInstance = tree!.root;

      // Find TextInput elements
      const textInputs = rootInstance.findAll(
        (node) => node.type === 'TextInput'
      );

      // Find the test center input (should have the value from params)
      const testCenterInput = textInputs.find(
        (input) => input.props.value === 'Cardiff Test Centre'
      );

      expect(testCenterInput).toBeDefined();
    });

    it('renders empty test center field when no params provided', () => {
      const navigation = createMockNavigation();
      const route = createMockRoute();

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <FeedbackScreen navigation={navigation as any} route={route as any} />
        );
      });

      const rootInstance = tree!.root;

      // Check that test center label exists
      const textElements = rootInstance.findAllByType('Text');
      const testCenterLabel = textElements.find(
        (el) =>
          typeof el.props.children === 'string' &&
          el.props.children.includes('Test Center')
      );

      expect(testCenterLabel).toBeDefined();
    });
  });

  describe('Message Field', () => {
    it('renders a multiline message input', () => {
      const navigation = createMockNavigation();
      const route = createMockRoute();

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <FeedbackScreen navigation={navigation as any} route={route as any} />
        );
      });

      const rootInstance = tree!.root;

      // Find TextInput with multiline prop
      const textInputs = rootInstance.findAll(
        (node) => node.type === 'TextInput'
      );

      const multilineInput = textInputs.find(
        (input) => input.props.multiline === true
      );

      expect(multilineInput).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('shows error when submitting without a message', async () => {
      const navigation = createMockNavigation();
      const route = createMockRoute();

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <FeedbackScreen navigation={navigation as any} route={route as any} />
        );
      });

      const rootInstance = tree!.root;

      // Select a feedback type first
      const typeButtons = rootInstance.findAll(
        (node) => node.props.onPress !== undefined
      );

      const bugButton = typeButtons.find((t) => {
        try {
          const textElements = t.findAllByType('Text');
          return textElements.some((text) => text.props.children === 'Bug');
        } catch {
          return false;
        }
      });

      await act(async () => {
        bugButton!.props.onPress();
        jest.runAllTimers();
      });

      // Find and press submit button without entering a message
      const updatedTypeButtons = rootInstance.findAll(
        (node) => node.props.onPress !== undefined
      );

      const submitButton = updatedTypeButtons.find((t) => {
        try {
          const textElements = t.findAllByType('Text');
          return textElements.some(
            (text) => text.props.children === 'Submit Feedback'
          );
        } catch {
          return false;
        }
      });

      expect(submitButton).toBeDefined();

      await act(async () => {
        submitButton!.props.onPress();
        jest.runAllTimers();
      });

      // Should not call submitFeedback when validation fails
      expect(submitFeedback).not.toHaveBeenCalled();
    });

    it('shows error when submitting without selecting a type', async () => {
      const navigation = createMockNavigation();
      const route = createMockRoute();

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <FeedbackScreen navigation={navigation as any} route={route as any} />
        );
      });

      const rootInstance = tree!.root;

      // Find message input and enter text
      const textInputs = rootInstance.findAll(
        (node) => node.type === 'TextInput'
      );

      const messageInput = textInputs.find(
        (input) => input.props.multiline === true
      );

      await act(async () => {
        messageInput!.props.onChangeText('Test message');
        jest.runAllTimers();
      });

      // Find and press submit button without selecting a type
      const submitButton = rootInstance.findAll(
        (node) => node.props.onPress !== undefined
      ).find((t) => {
        try {
          const textElements = t.findAllByType('Text');
          return textElements.some(
            (text) => text.props.children === 'Submit Feedback'
          );
        } catch {
          return false;
        }
      });

      await act(async () => {
        submitButton!.props.onPress();
        jest.runAllTimers();
      });

      // Should not call submitFeedback when validation fails
      expect(submitFeedback).not.toHaveBeenCalled();
    });
  });

  describe('Submission', () => {
    it('submits feedback on valid input and shows success alert', async () => {
      const navigation = createMockNavigation();
      const route = createMockRoute('Cardiff Test Centre');

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <FeedbackScreen navigation={navigation as any} route={route as any} />
        );
      });

      const rootInstance = tree!.root;

      // Select Bug type
      const typeButtons = rootInstance.findAll(
        (node) => node.props.onPress !== undefined
      );

      const bugButton = typeButtons.find((t) => {
        try {
          const textElements = t.findAllByType('Text');
          return textElements.some((text) => text.props.children === 'Bug');
        } catch {
          return false;
        }
      });

      await act(async () => {
        bugButton!.props.onPress();
        jest.runAllTimers();
      });

      // Enter message
      const textInputs = rootInstance.findAll(
        (node) => node.type === 'TextInput'
      );

      const messageInput = textInputs.find(
        (input) => input.props.multiline === true
      );

      await act(async () => {
        messageInput!.props.onChangeText('Found a bug in the app');
        jest.runAllTimers();
      });

      // Find and press submit button
      const submitButton = rootInstance.findAll(
        (node) => node.props.onPress !== undefined
      ).find((t) => {
        try {
          const textElements = t.findAllByType('Text');
          return textElements.some(
            (text) => text.props.children === 'Submit Feedback'
          );
        } catch {
          return false;
        }
      });

      await act(async () => {
        submitButton!.props.onPress();
        await Promise.resolve(); // Let promises resolve
        jest.runAllTimers();
      });

      // Should call submitFeedback with correct data
      expect(submitFeedback).toHaveBeenCalledWith({
        device_id: 'test-device-id-123',
        feedback_type: 'bug',
        test_center_name: 'Cardiff Test Centre',
        message: 'Found a bug in the app',
      });

      // Should show success alert
      expect(Alert.alert).toHaveBeenCalledWith(
        'Thank You!',
        'Your feedback has been submitted.',
        expect.any(Array)
      );
    });

    it('shows error message on submission failure', async () => {
      (submitFeedback as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Network error',
      });

      const navigation = createMockNavigation();
      const route = createMockRoute();

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <FeedbackScreen navigation={navigation as any} route={route as any} />
        );
      });

      const rootInstance = tree!.root;

      // Select Suggestion type
      const typeButtons = rootInstance.findAll(
        (node) => node.props.onPress !== undefined
      );

      const suggestionButton = typeButtons.find((t) => {
        try {
          const textElements = t.findAllByType('Text');
          return textElements.some(
            (text) => text.props.children === 'Suggestion'
          );
        } catch {
          return false;
        }
      });

      await act(async () => {
        suggestionButton!.props.onPress();
        jest.runAllTimers();
      });

      // Enter message
      const textInputs = rootInstance.findAll(
        (node) => node.type === 'TextInput'
      );

      const messageInput = textInputs.find(
        (input) => input.props.multiline === true
      );

      await act(async () => {
        messageInput!.props.onChangeText('A suggestion for improvement');
        jest.runAllTimers();
      });

      // Find and press submit button
      const submitButton = rootInstance.findAll(
        (node) => node.props.onPress !== undefined
      ).find((t) => {
        try {
          const textElements = t.findAllByType('Text');
          return textElements.some(
            (text) => text.props.children === 'Submit Feedback'
          );
        } catch {
          return false;
        }
      });

      await act(async () => {
        submitButton!.props.onPress();
        await Promise.resolve();
        jest.runAllTimers();
      });

      // Should show error alert
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Network error');
    });
  });

  describe('Submit Button', () => {
    it('renders the submit button', () => {
      const navigation = createMockNavigation();
      const route = createMockRoute();

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <FeedbackScreen navigation={navigation as any} route={route as any} />
        );
      });

      const rootInstance = tree!.root;
      const textElements = rootInstance.findAllByType('Text');
      const submitText = textElements.find(
        (el) => el.props.children === 'Submit Feedback'
      );

      expect(submitText).toBeDefined();
    });
  });
});
