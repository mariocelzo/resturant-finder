import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { ButtonSize, BorderRadius, Typography, Shadows } from '../styles/designSystem';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSizeType = 'sm' | 'base' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSizeType;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'base',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
}: ButtonProps) {
  const { theme } = useTheme();
  const sizeConfig = ButtonSize[size];

  const getBackgroundColor = () => {
    if (disabled) return theme.textSecondary + '40';

    switch (variant) {
      case 'primary':
        return theme.primary;
      case 'secondary':
        return theme.surface;
      case 'outline':
        return 'transparent';
      case 'ghost':
        return 'transparent';
      case 'danger':
        return theme.error;
      default:
        return theme.primary;
    }
  };

  const getTextColor = (): string => {
    if (disabled) return theme.textSecondary;

    switch (variant) {
      case 'primary':
      case 'danger':
        return '#FFFFFF';
      case 'secondary':
      case 'outline':
      case 'ghost':
        return theme.primary;
      default:
        return '#FFFFFF';
    }
  };

  const getBorderStyle = () => {
    if (variant === 'outline') {
      return {
        borderWidth: 2,
        borderColor: disabled ? theme.textSecondary + '40' : theme.primary,
      };
    }
    return {};
  };

  const buttonStyle: ViewStyle = {
    height: sizeConfig.height,
    paddingHorizontal: sizeConfig.paddingHorizontal,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: getBackgroundColor(),
    opacity: disabled ? 0.5 : 1,
    ...(variant !== 'ghost' ? Shadows.base : {}),
    ...(fullWidth ? { width: '100%' } : {}),
    ...getBorderStyle(),
    ...style,
  };

  const textStyle: TextStyle = {
    color: getTextColor(),
    fontSize: sizeConfig.fontSize,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: Typography.letterSpacing.wide,
  };

  const renderContent = () => (
    <>
      {loading && (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
          style={{ marginRight: icon ? 8 : 0 }}
        />
      )}
      {!loading && icon && (
        <Text style={[textStyle, { marginRight: 8, fontSize: sizeConfig.fontSize + 2 }]}>
          {icon}
        </Text>
      )}
      <Text style={textStyle}>{title}</Text>
    </>
  );

  if (variant === 'primary' && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[buttonStyle, { backgroundColor: 'transparent', overflow: 'hidden' }]}
      >
        <LinearGradient
          colors={[theme.primary, theme.primary + 'DD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={buttonStyle}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}
