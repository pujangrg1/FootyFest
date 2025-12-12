import { Platform, Dimensions } from 'react-native';

// Platform detection helpers
export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// Screen size detection
const { width, height } = Dimensions.get('window');

// Responsive breakpoints
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
};

// Device type detection
export const getDeviceType = () => {
  if (isWeb) {
    if (width < BREAKPOINTS.mobile) return 'mobile';
    if (width < BREAKPOINTS.tablet) return 'tablet';
    return 'desktop';
  }
  return isMobile ? 'mobile' : 'unknown';
};

// Responsive helpers
export const isMobileSize = () => width < BREAKPOINTS.mobile;
export const isTabletSize = () => width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
export const isDesktopSize = () => width >= BREAKPOINTS.tablet;

// Get responsive value based on screen size
export const getResponsiveValue = (mobile, tablet, desktop) => {
  if (isMobileSize()) return mobile;
  if (isTabletSize()) return tablet;
  return desktop;
};

// Subscribe to dimension changes
export const subscribeToDimensions = (callback) => {
  const subscription = Dimensions.addEventListener('change', ({ window }) => {
    callback(window);
  });
  return () => subscription?.remove();
};

export default {
  isWeb,
  isMobile,
  isIOS,
  isAndroid,
  getDeviceType,
  isMobileSize,
  isTabletSize,
  isDesktopSize,
  getResponsiveValue,
  subscribeToDimensions,
  BREAKPOINTS,
};


