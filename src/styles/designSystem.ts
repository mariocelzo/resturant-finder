/**
 * Sistema di Design Unificato per NearBite
 * Questo file centralizza tutte le costanti di design per mantenere consistenza
 */

import { Platform } from 'react-native';

// SPACING SYSTEM (Multipli di 4)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
} as const;

// TYPOGRAPHY SYSTEM
export const Typography = {
  // Font Sizes
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    huge: 32,
    display: 40,
  },
  // Font Weights
  fontWeight: {
    regular: '400' as const,
    medium: '600' as const,
    semibold: '700' as const,
    bold: '800' as const,
    black: '900' as const,
  },
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
} as const;

// BORDER RADIUS SYSTEM
export const BorderRadius = {
  xs: 4,
  sm: 8,
  base: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  round: 999,
} as const;

// SHADOW/ELEVATION SYSTEM
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
  }),
  base: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    android: {
      elevation: 6,
    },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
    },
  }),
  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 20,
    },
    android: {
      elevation: 12,
    },
  }),
  floating: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
    },
    android: {
      elevation: 16,
    },
  }),
} as const;

// OPACITY SYSTEM
export const Opacity = {
  transparent: 0,
  semiTransparent: 0.1,
  light: 0.2,
  medium: 0.5,
  heavy: 0.8,
  opaque: 1,
} as const;

// ICON SIZES
export const IconSize = {
  xs: 16,
  sm: 20,
  base: 24,
  md: 28,
  lg: 32,
  xl: 40,
  xxl: 48,
  huge: 64,
} as const;

// ANIMATION DURATIONS
export const Animation = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
    verySlow: 500,
  },
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

// LAYOUT CONSTANTS
export const Layout = {
  screenPadding: Spacing.base,
  cardPadding: Spacing.base,
  sectionSpacing: Spacing.xl,
  itemSpacing: Spacing.md,
  maxContentWidth: 600,
  tabBarHeight: 72,
  headerHeight: 60,
} as const;

// Z-INDEX SYSTEM
export const ZIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  overlay: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
} as const;

// COMMON STYLES HELPERS
export const CommonStyles = {
  // Flexbox
  flexCenter: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  flexRow: {
    flexDirection: 'row' as const,
  },
  flexRowCenter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  flexBetween: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },

  // Container
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    padding: Layout.screenPadding,
  },

  // Card
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    ...Shadows.base,
  },
  cardLarge: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
} as const;

// GRADIENT PRESETS
export const GradientPresets = {
  primary: {
    light: ['#FF6B6B15', '#FF6B6B08'],
    dark: ['#FF6B6B40', '#FF6B6B20'],
  },
  success: {
    light: ['#4CAF5015', '#4CAF5008'],
    dark: ['#4CAF5040', '#4CAF5020'],
  },
  warning: {
    light: ['#FFA72615', '#FFA72608'],
    dark: ['#FFA72640', '#FFA72620'],
  },
  error: {
    light: ['#F4433615', '#F4433608'],
    dark: ['#F4433640', '#F4433620'],
  },
} as const;

// BUTTON SIZES
export const ButtonSize = {
  sm: {
    height: 36,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
  },
  base: {
    height: 44,
    paddingHorizontal: Spacing.base,
    fontSize: Typography.fontSize.base,
  },
  lg: {
    height: 52,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.lg,
  },
} as const;

// INPUT HEIGHTS
export const InputSize = {
  sm: 36,
  base: 44,
  lg: 52,
} as const;

// EMOJI SIZES (per tipo di elemento)
export const EmojiSize = {
  icon: 20,
  card: 32,
  header: 40,
  hero: 64,
  display: 80,
} as const;

export default {
  Spacing,
  Typography,
  BorderRadius,
  Shadows,
  Opacity,
  IconSize,
  Animation,
  Layout,
  ZIndex,
  CommonStyles,
  GradientPresets,
  ButtonSize,
  InputSize,
  EmojiSize,
};
