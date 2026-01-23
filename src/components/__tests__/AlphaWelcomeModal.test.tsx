/**
 * AlphaWelcomeModal Tests
 * =======================
 * Tests for the Alpha Welcome Modal component
 */

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AlphaWelcomeModal } from '../AlphaWelcomeModal';

describe('AlphaWelcomeModal', () => {
  describe('when visible is true', () => {
    it('renders the modal content', () => {
      const mockDismiss = jest.fn();
      const tree = renderer.create(
        <AlphaWelcomeModal visible={true} onDismiss={mockDismiss} />
      );

      const rootInstance = tree.root;

      // Check that modal content is rendered
      expect(rootInstance.findAllByType('View').length).toBeGreaterThan(0);
    });

    it('displays the "Welcome to Alpha" title', () => {
      const mockDismiss = jest.fn();
      const tree = renderer.create(
        <AlphaWelcomeModal visible={true} onDismiss={mockDismiss} />
      );

      const rootInstance = tree.root;
      const textElements = rootInstance.findAllByType('Text');
      const titleText = textElements.find(
        (el) => el.props.children === 'Welcome to Alpha'
      );

      expect(titleText).toBeDefined();
    });

    it('displays the ALPHA VERSION badge', () => {
      const mockDismiss = jest.fn();
      const tree = renderer.create(
        <AlphaWelcomeModal visible={true} onDismiss={mockDismiss} />
      );

      const rootInstance = tree.root;
      const textElements = rootInstance.findAllByType('Text');
      const badgeText = textElements.find(
        (el) => el.props.children === 'ALPHA VERSION'
      );

      expect(badgeText).toBeDefined();
    });

    it('displays all 3 bullet points', () => {
      const mockDismiss = jest.fn();
      const tree = renderer.create(
        <AlphaWelcomeModal visible={true} onDismiss={mockDismiss} />
      );

      const rootInstance = tree.root;
      const textElements = rootInstance.findAllByType('Text');

      // Check for bullet numbers
      const bullet1 = textElements.find((el) => el.props.children === '1.');
      const bullet2 = textElements.find((el) => el.props.children === '2.');
      const bullet3 = textElements.find((el) => el.props.children === '3.');

      expect(bullet1).toBeDefined();
      expect(bullet2).toBeDefined();
      expect(bullet3).toBeDefined();

      // Check for bullet content
      const bulletTexts = textElements.map((el) => el.props.children);

      expect(bulletTexts).toContain(
        'We are currently in active development.'
      );
      expect(bulletTexts).toContain(
        'Most test centers currently have 1 free route.'
      );
      expect(bulletTexts).toContain(
        'Full route packs are being deployed based on user demand and feedback.'
      );
    });

    it('displays the "I Understand" button', () => {
      const mockDismiss = jest.fn();
      const tree = renderer.create(
        <AlphaWelcomeModal visible={true} onDismiss={mockDismiss} />
      );

      const rootInstance = tree.root;
      const textElements = rootInstance.findAllByType('Text');
      const buttonText = textElements.find(
        (el) => el.props.children === 'I Understand'
      );

      expect(buttonText).toBeDefined();
    });

    it('calls onDismiss when "I Understand" button is pressed', () => {
      const mockDismiss = jest.fn();
      const tree = renderer.create(
        <AlphaWelcomeModal visible={true} onDismiss={mockDismiss} />
      );

      const rootInstance = tree.root;
      // Find the touchable element by looking for one with onPress prop
      const touchables = rootInstance.findAll(
        (node) =>
          node.props.onPress !== undefined &&
          node.props.accessibilityRole !== 'text'
      );

      // Find the button (should be the one containing "I Understand")
      const button = touchables.find((t) => {
        try {
          const textElements = t.findAllByType('Text');
          return textElements.some(
            (text) => text.props.children === 'I Understand'
          );
        } catch {
          return false;
        }
      });

      expect(button).toBeDefined();

      act(() => {
        button!.props.onPress();
      });

      expect(mockDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('when visible is false', () => {
    it('returns null and does not render any content', () => {
      const mockDismiss = jest.fn();
      const tree = renderer.create(
        <AlphaWelcomeModal visible={false} onDismiss={mockDismiss} />
      );

      // When visible is false, component should return null
      expect(tree.toJSON()).toBeNull();
    });
  });
});
