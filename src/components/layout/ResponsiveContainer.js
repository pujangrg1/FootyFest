import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { isMobileSize, isTabletSize, isDesktopSize } from '../../utils/platform';

/**
 * Responsive container that adapts layout based on screen size
 */
export default function ResponsiveContainer({
  children,
  mobileStyle,
  tabletStyle,
  desktopStyle,
  style,
  ...props
}) {
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  const getResponsiveStyle = () => {
    if (isDesktopSize()) {
      return [styles.base, mobileStyle, tabletStyle, desktopStyle, style];
    }
    if (isTabletSize()) {
      return [styles.base, mobileStyle, tabletStyle, style];
    }
    return [styles.base, mobileStyle, style];
  };

  return (
    <View style={getResponsiveStyle()} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
});


