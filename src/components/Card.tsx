import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Pressable, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { BorderRadius, Spacing, Shadows } from '../styles/designSystem';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof Spacing;
  style?: ViewStyle;
  pressable?: boolean;
}

export default function Card({
  children,
  onPress,
  variant = 'elevated',
  padding = 'base',
  style,
  pressable = true,
}: CardProps) {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!onPress || !pressable) return;
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress || !pressable) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: theme.cardBackground,
      borderRadius: BorderRadius.lg,
      padding: Spacing[padding],
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          ...Shadows.md,
          shadowColor: theme.shadowColor,
          borderWidth: theme.isDark ? 1 : 0,
          borderColor: theme.border,
        };
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1.5,
          borderColor: theme.border,
        };
      case 'default':
      default:
        return {
          ...baseStyle,
          ...Shadows.base,
          shadowColor: theme.shadowColor,
        };
    }
  };

  if (onPress && pressable) {
    return (
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[getCardStyle(), style, { transform: [{ scale: scaleAnim }] }]}>
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return <View style={[getCardStyle(), style]}>{children}</View>;
}

// Varianti specializzate
export function HeroCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.cardBackground,
          borderRadius: BorderRadius.xl,
          padding: Spacing.lg,
          ...Shadows.lg,
          shadowColor: theme.shadowColor,
          borderWidth: theme.isDark ? 1 : 0,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function FloatingCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.cardBackground,
          borderRadius: BorderRadius.xxl,
          padding: Spacing.xl,
          ...Shadows.floating,
          shadowColor: theme.shadowColor,
          borderWidth: theme.isDark ? 1 : 0,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
