import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { BorderRadius, Spacing, Typography } from '../styles/designSystem';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';
export type BadgeSize = 'sm' | 'base' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: string;
  style?: ViewStyle;
}

export default function Badge({
  label,
  variant = 'primary',
  size = 'base',
  icon,
  style,
}: BadgeProps) {
  const { theme } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'success':
        return {
          bg: theme.isDark ? '#1B5E20' : '#E8F5E9',
          text: theme.isDark ? '#A5D6A7' : '#2E7D32',
        };
      case 'warning':
        return {
          bg: theme.isDark ? '#E65100' : '#FFF3E0',
          text: theme.isDark ? '#FFCC80' : '#E65100',
        };
      case 'error':
        return {
          bg: theme.isDark ? '#B71C1C' : '#FDECEA',
          text: theme.isDark ? '#EF9A9A' : '#C62828',
        };
      case 'neutral':
        return {
          bg: theme.surface,
          text: theme.textSecondary,
        };
      case 'primary':
      default:
        return {
          bg: theme.primary + '20',
          text: theme.primary,
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: Spacing.xs,
          paddingHorizontal: Spacing.sm,
          fontSize: Typography.fontSize.xs,
          borderRadius: BorderRadius.sm,
        };
      case 'lg':
        return {
          paddingVertical: Spacing.sm,
          paddingHorizontal: Spacing.md,
          fontSize: Typography.fontSize.md,
          borderRadius: BorderRadius.base,
        };
      case 'base':
      default:
        return {
          paddingVertical: Spacing.xs + 1,
          paddingHorizontal: Spacing.sm + 2,
          fontSize: Typography.fontSize.sm,
          borderRadius: BorderRadius.sm + 2,
        };
    }
  };

  const colors = getColors();
  const sizeConfig = getSizeConfig();

  const containerStyle: ViewStyle = {
    backgroundColor: colors.bg,
    paddingVertical: sizeConfig.paddingVertical,
    paddingHorizontal: sizeConfig.paddingHorizontal,
    borderRadius: sizeConfig.borderRadius,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    ...style,
  };

  const textStyle: TextStyle = {
    color: colors.text,
    fontSize: sizeConfig.fontSize,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 0.2,
  };

  return (
    <View style={containerStyle}>
      {icon && (
        <Text style={[textStyle, { marginRight: Spacing.xs, fontSize: sizeConfig.fontSize + 1 }]}>
          {icon}
        </Text>
      )}
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}

// Componenti specializzati
export function StatusBadge({ isOpen, style }: { isOpen: boolean; style?: ViewStyle }) {
  return (
    <Badge
      label={isOpen ? 'Aperto' : 'Chiuso'}
      variant={isOpen ? 'success' : 'error'}
      icon={isOpen ? '🟢' : '🔴'}
      size="sm"
      style={style}
    />
  );
}

export function RatingBadge({ rating, style }: { rating: number; style?: ViewStyle }) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.primary + '20',
          paddingVertical: Spacing.xs + 1,
          paddingHorizontal: Spacing.sm + 2,
          borderRadius: BorderRadius.base,
          flexDirection: 'row',
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: theme.primary,
          fontSize: Typography.fontSize.sm,
          fontWeight: Typography.fontWeight.bold,
        }}
      >
        ⭐ {rating.toFixed(1)}
      </Text>
    </View>
  );
}

export function PriceBadge({ level, style }: { level: number; style?: ViewStyle }) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.success + '20',
          paddingVertical: Spacing.xs + 1,
          paddingHorizontal: Spacing.sm + 2,
          borderRadius: BorderRadius.base,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: theme.success,
          fontSize: Typography.fontSize.sm,
          fontWeight: Typography.fontWeight.bold,
        }}
      >
        {'€'.repeat(Math.max(1, Math.min(4, level)))}
      </Text>
    </View>
  );
}

export function CuisineBadge({ cuisine, style }: { cuisine: string; style?: ViewStyle }) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.primary + '15',
          paddingVertical: Spacing.xs + 1,
          paddingHorizontal: Spacing.sm + 2,
          borderRadius: BorderRadius.base,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: theme.primary,
          fontSize: Typography.fontSize.xs,
          fontWeight: Typography.fontWeight.bold,
          letterSpacing: 0.3,
        }}
      >
        {cuisine}
      </Text>
    </View>
  );
}
