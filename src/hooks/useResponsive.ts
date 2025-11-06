import { useWindowDimensions, Platform } from 'react-native';

export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;

export interface ResponsiveConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  isWeb: boolean;
  isNative: boolean;
  width: number;
  height: number;
  columns: number; // Numero colonne suggerito per grid
  spacing: number; // Spaziatura suggerita
  fontSize: {
    h1: number;
    h2: number;
    h3: number;
    body: number;
    small: number;
  };
}

/**
 * Hook per gestire layout responsive
 *
 * @example
 * ```typescript
 * function MyScreen() {
 *   const { isDesktop, isWeb, columns } = useResponsive();
 *
 *   if (isWeb && isDesktop) {
 *     return <DesktopLayout />;
 *   }
 *
 *   return <MobileLayout />;
 * }
 * ```
 */
export function useResponsive(): ResponsiveConfig {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isNative = !isWeb;

  // Breakpoint detection
  const isMobile = width < breakpoints.tablet;
  const isTablet = width >= breakpoints.tablet && width < breakpoints.desktop;
  const isDesktop = width >= breakpoints.desktop && width < breakpoints.wide;
  const isWide = width >= breakpoints.wide;

  // Numero di colonne suggerito per grid layouts
  const columns = isWide ? 4 : isDesktop ? 3 : isTablet ? 2 : 1;

  // Spaziatura suggerita in base alla dimensione
  const spacing = isMobile ? 12 : isTablet ? 16 : 24;

  // Font sizes responsive
  const fontSize = {
    h1: isMobile ? 24 : isTablet ? 28 : isDesktop ? 32 : 36,
    h2: isMobile ? 20 : isTablet ? 22 : isDesktop ? 24 : 28,
    h3: isMobile ? 18 : isTablet ? 20 : isDesktop ? 22 : 24,
    body: 16,
    small: isMobile ? 12 : 14,
  };

  return {
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    isWeb,
    isNative,
    width,
    height,
    columns,
    spacing,
    fontSize,
  };
}

/**
 * Helper per applicare stili condizionali in base al breakpoint
 *
 * @example
 * ```typescript
 * const styles = StyleSheet.create({
 *   container: {
 *     ...responsiveStyle({
 *       mobile: { padding: 12 },
 *       tablet: { padding: 16 },
 *       desktop: { padding: 24 },
 *     })
 *   }
 * });
 * ```
 */
export function responsiveStyle<T>(config: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  wide?: T;
}): T | {} {
  const { width } = useWindowDimensions();

  if (width >= breakpoints.wide && config.wide) return config.wide;
  if (width >= breakpoints.desktop && config.desktop) return config.desktop;
  if (width >= breakpoints.tablet && config.tablet) return config.tablet;
  if (config.mobile) return config.mobile;

  return {};
}

/**
 * Hook per nascondere/mostrare elementi in base al breakpoint
 *
 * @example
 * ```typescript
 * const visibility = useResponsiveVisibility();
 *
 * return (
 *   <View>
 *     {visibility.showOnDesktop && <Sidebar />}
 *     {visibility.showOnMobile && <BottomTabs />}
 *   </View>
 * );
 * ```
 */
export function useResponsiveVisibility() {
  const { isMobile, isTablet, isDesktop, isWide } = useResponsive();

  return {
    showOnMobile: isMobile,
    showOnTablet: isTablet || isMobile,
    showOnDesktop: isDesktop || isWide,
    showOnWide: isWide,
    hideOnMobile: !isMobile,
    hideOnTablet: !isTablet,
    hideOnDesktop: !(isDesktop || isWide),
  };
}
