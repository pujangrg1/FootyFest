import { Dimensions } from 'react-native';
import { BREAKPOINTS, getResponsiveValue } from '../utils/platform';

const { width, height } = Dimensions.get('window');

// Responsive spacing
export const spacing = {
  xs: getResponsiveValue(4, 6, 8),
  sm: getResponsiveValue(8, 12, 16),
  md: getResponsiveValue(12, 16, 24),
  lg: getResponsiveValue(16, 24, 32),
  xl: getResponsiveValue(24, 32, 48),
  xxl: getResponsiveValue(32, 48, 64),
};

// Responsive font sizes
export const fontSize = {
  xs: getResponsiveValue(10, 11, 12),
  sm: getResponsiveValue(12, 13, 14),
  md: getResponsiveValue(14, 15, 16),
  lg: getResponsiveValue(16, 18, 20),
  xl: getResponsiveValue(20, 24, 28),
  xxl: getResponsiveValue(24, 32, 36),
};

// Container widths
export const containerWidth = {
  mobile: '100%',
  tablet: '90%',
  desktop: '1200px',
  maxWidth: getResponsiveValue('100%', '90%', '1200px'),
};

// Grid columns
export const gridColumns = {
  mobile: 1,
  tablet: 2,
  desktop: 3,
  getColumns: () => getResponsiveValue(1, 2, 3),
};

// Card dimensions
export const cardDimensions = {
  mobile: { width: '100%', minHeight: 120 },
  tablet: { width: '48%', minHeight: 140 },
  desktop: { width: '31%', minHeight: 160 },
  getDimensions: () => {
    if (width < BREAKPOINTS.mobile) return cardDimensions.mobile;
    if (width < BREAKPOINTS.tablet) return cardDimensions.tablet;
    return cardDimensions.desktop;
  },
};

// Helper function to create responsive styles
export const createResponsiveStyle = (mobileStyle, tabletStyle, desktopStyle) => {
  if (width < BREAKPOINTS.mobile) return mobileStyle;
  if (width < BREAKPOINTS.tablet) return { ...mobileStyle, ...tabletStyle };
  return { ...mobileStyle, ...tabletStyle, ...desktopStyle };
};

// Common responsive patterns
export const responsive = {
  padding: {
    screen: getResponsiveValue(16, 24, 32),
    card: getResponsiveValue(12, 16, 20),
    button: getResponsiveValue(12, 14, 16),
  },
  margin: {
    screen: getResponsiveValue(16, 24, 32),
    card: getResponsiveValue(8, 12, 16),
    section: getResponsiveValue(24, 32, 48),
  },
  borderRadius: {
    small: getResponsiveValue(4, 6, 8),
    medium: getResponsiveValue(8, 10, 12),
    large: getResponsiveValue(12, 16, 20),
  },
  iconSize: {
    small: getResponsiveValue(16, 18, 20),
    medium: getResponsiveValue(20, 24, 28),
    large: getResponsiveValue(24, 32, 40),
  },
};

export default {
  spacing,
  fontSize,
  containerWidth,
  gridColumns,
  cardDimensions,
  createResponsiveStyle,
  responsive,
  BREAKPOINTS,
};


