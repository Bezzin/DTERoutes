/**
 * Theme Typography
 * =================
 * Text styles for consistent typography across the app
 */

import {TextStyle} from 'react-native';
import {Colors} from './colors';

export const Typography: Record<string, TextStyle> = {
  // Headings
  h1: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },

  // Body Text
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.text,
    lineHeight: 24,
  },
  bodySecondary: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // Captions & Labels
  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textMuted,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Buttons
  button: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },

  // Special
  badge: {
    fontSize: 12,
    fontWeight: '600',
  },
  stat: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textMuted,
  },

  // Route/Game specific
  routeNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  routeName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },

  // Links
  link: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primaryAccent,
  },
};

// Font families (if custom fonts are added later)
export const FontFamilies = {
  regular: undefined, // System default
  medium: undefined,
  semibold: undefined,
  bold: undefined,
};
