/**
 * ScrollView Web Wrapper
 *
 * Fix per lo scroll su web - React Native Web non gestisce bene ScrollView
 * Questo wrapper usa un div nativo con overflow: auto
 */

import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';

interface ScrollViewProps {
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
  children: React.ReactNode;
}

export default function ScrollView({
  style,
  contentContainerStyle,
  children,
}: ScrollViewProps) {
  return (
    <View
      style={[
        {
          flex: 1,
          overflow: 'auto' as any,
          WebkitOverflowScrolling: 'touch' as any,
        },
        style,
      ]}
    >
      <View style={contentContainerStyle}>
        {children}
      </View>
    </View>
  );
}
