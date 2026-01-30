/**
 * Theme Colors
 * =============
 * Dark mode gamified color palette for Test Routes Expert
 */

export const Colors = {
  // Primary Background Palette
  background: '#121212', // Deep Carbon - main background
  backgroundSecondary: '#1E1E1E', // Dark Charcoal - card surfaces
  backgroundTertiary: '#2A2A2A', // Lighter dark for elevated elements

  // Primary Accent
  primaryAccent: '#FF5722', // Vibrant/Neon Orange
  primaryAccentLight: '#FF7043', // Lighter orange for hover/gradients
  primaryAccentDark: '#E64A19', // Darker orange for pressed states

  // Text Colors
  text: '#FFFFFF', // Primary text
  textSecondary: 'rgba(255, 255, 255, 0.7)', // Secondary text
  textMuted: 'rgba(255, 255, 255, 0.5)', // Muted/disabled text
  textOnAccent: '#000000', // Text on orange backgrounds

  // Semantic Colors
  success: '#4CAF50', // Green - completed states
  successLight: '#66BB6A',
  warning: '#FFC107', // Yellow/Amber - warnings
  error: '#F44336', // Red - errors, danger
  errorLight: '#EF5350',

  // Route Status Colors
  completed: '#4CAF50', // Green checkmark
  active: '#FF5722', // Orange pulse
  locked: 'rgba(255, 255, 255, 0.3)', // Dimmed for locked

  // Road/Map Colors
  road: '#333333', // Asphalt gray
  roadDark: '#1A1A1A', // Darker road variant
  roadMarking: '#FFFFFF', // White road markings
  routeGlow: 'rgba(255, 87, 34, 0.6)', // Orange glow for route lines

  // UI Element Colors
  border: 'rgba(255, 255, 255, 0.1)', // Subtle borders
  borderActive: '#FF5722', // Active/focused border
  overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlays
  grabHandle: 'rgba(255, 255, 255, 0.3)', // Bottom sheet grab handle

  // Legacy Colors (for gradual migration)
  legacyBlue: '#2563eb',
  legacyLightGray: '#f3f4f6',
};

// Gradient definitions for LinearGradient
export const Gradients = {
  // Carbon background with depth
  carbonBackground: ['#1A1A1A', '#121212', '#0A0A0A'],

  // Orange button gradient
  orangeButton: ['#FF7043', '#FF5722', '#E64A19'],

  // Orange glow effect
  orangeGlow: ['rgba(255, 87, 34, 0)', 'rgba(255, 87, 34, 0.3)', 'rgba(255, 87, 34, 0)'],

  // Construction stripe pattern colors
  constructionStripe: ['#FFC107', '#333333'],

  // Subtle card highlight
  cardHighlight: ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0)'],
};

// Shadow styles for dark mode
export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    shadowColor: '#FF5722',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  glow: {
    shadowColor: '#FF5722',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
};
