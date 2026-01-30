/**
 * Theme Spacing
 * ==============
 * Consistent spacing scale and layout constants
 */

// Base spacing scale (4px increments)
export const Spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius scale
export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  round: 999, // Fully rounded (pill shape)
};

// Common layout values
export const Layout = {
  // Screen padding
  screenPaddingHorizontal: Spacing.md,
  screenPaddingVertical: Spacing.md,

  // Card dimensions
  cardPadding: Spacing.md,
  cardMargin: Spacing.md,
  cardBorderRadius: BorderRadius.lg,

  // Button dimensions
  buttonHeight: 56,
  buttonHeightSmall: 44,
  buttonBorderRadius: BorderRadius.md,

  // Input dimensions
  inputHeight: 56,
  inputBorderRadius: BorderRadius.md,
  inputPaddingHorizontal: Spacing.md,

  // Bottom sheet
  bottomSheetHandleHeight: 4,
  bottomSheetHandleWidth: 40,
  bottomSheetBorderRadius: BorderRadius.xl,

  // Roundabout/Node sizes
  roundaboutSize: 70,
  roundaboutSizeLarge: 80,
  carAvatarSize: 40,

  // Road dimensions
  roadWidth: 60,
  roadSegmentHeight: 100,

  // Header
  headerHeight: 60,
  stickyHeaderHeight: 80,

  // Badge sizes
  badgeHeight: 24,
  badgePaddingHorizontal: Spacing.sm,
};

// Z-index scale for layering
export const ZIndex = {
  base: 0,
  card: 1,
  sticky: 10,
  modal: 100,
  overlay: 90,
  bottomSheet: 100,
  tooltip: 110,
};

// Animation durations
export const Durations = {
  fast: 150,
  normal: 300,
  slow: 500,
  pulse: 1000,
  entrance: 400,
};
