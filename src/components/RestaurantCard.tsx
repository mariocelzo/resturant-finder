import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, Animated } from 'react-native';
import { Restaurant } from '../services/googlePlaces';
import { useTheme } from '../contexts/ThemeContext';
import { StatusBadge, RatingBadge, PriceBadge, CuisineBadge } from './Badge';
import {
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
  EmojiSize,
} from '../styles/designSystem';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress: () => void;
  variant?: 'default' | 'compact' | 'featured';
}

export default function RestaurantCard({
  restaurant,
  onPress,
  variant = 'default',
}: RestaurantCardProps) {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  if (variant === 'compact') {
    return (
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View
          style={[
            styles.compactCard,
            {
              backgroundColor: theme.cardBackground,
              borderWidth: theme.isDark ? 1 : 0,
              borderColor: theme.border,
              shadowColor: theme.shadowColor,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {restaurant.photoUrl ? (
            <Image source={{ uri: restaurant.photoUrl }} style={styles.compactImage} />
          ) : (
            <View
              style={[
                styles.compactImage,
                {
                  backgroundColor: theme.primary + '15',
                  justifyContent: 'center',
                  alignItems: 'center',
                },
              ]}
            >
              <Text style={{ fontSize: EmojiSize.card }}>🍽️</Text>
            </View>
          )}
          <View style={styles.compactContent}>
            <Text
              style={[styles.compactName, { color: theme.text }]}
              numberOfLines={1}
            >
              {restaurant.name}
            </Text>
            <RatingBadge rating={restaurant.rating || 0} style={{ marginTop: Spacing.xs }} />
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  if (variant === 'featured') {
    return (
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View
          style={[
            styles.featuredCard,
            {
              backgroundColor: theme.cardBackground,
              borderWidth: theme.isDark ? 1 : 0,
              borderColor: theme.border,
              shadowColor: theme.shadowColor,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.featuredImageContainer}>
            {restaurant.photoUrl ? (
              <Image source={{ uri: restaurant.photoUrl }} style={styles.featuredImage} />
            ) : (
              <View
                style={[
                  styles.featuredImage,
                  {
                    backgroundColor: theme.primary + '15',
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
                <Text style={{ fontSize: EmojiSize.hero }}>🍽️</Text>
              </View>
            )}
            <View style={styles.featuredStatusOverlay}>
              <StatusBadge isOpen={restaurant.isOpen || false} />
            </View>
          </View>
          <View style={styles.featuredContent}>
            <Text style={[styles.featuredName, { color: theme.text }]} numberOfLines={2}>
              {restaurant.name}
            </Text>
            <Text
              style={[styles.featuredAddress, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              📍 {restaurant.address}
            </Text>
            <View style={styles.featuredMeta}>
              <RatingBadge rating={restaurant.rating || 0} />
              {restaurant.priceLevel && (
                <PriceBadge level={restaurant.priceLevel} style={{ marginLeft: Spacing.xs }} />
              )}
              {restaurant.cuisine_type && (
                <CuisineBadge
                  cuisine={restaurant.cuisine_type}
                  style={{ marginLeft: Spacing.xs }}
                />
              )}
            </View>
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  // Default variant
  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBackground,
            borderWidth: theme.isDark ? 1 : 0,
            borderColor: theme.border,
            shadowColor: theme.shadowColor,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.cardRow}>
          <View style={styles.imageContainer}>
            {restaurant.photoUrl ? (
              <Image source={{ uri: restaurant.photoUrl }} style={styles.image} />
            ) : (
              <View
                style={[
                  styles.imagePlaceholder,
                  { backgroundColor: theme.primary + '15' },
                ]}
              >
                <Text style={{ fontSize: EmojiSize.card }}>🍽️</Text>
              </View>
            )}
            <View style={styles.statusOverlay}>
              <StatusBadge isOpen={restaurant.isOpen || false} />
            </View>
          </View>

          <View style={styles.content}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {restaurant.name}
            </Text>
            <Text
              style={[styles.address, { color: theme.textSecondary }]}
              numberOfLines={2}
            >
              {restaurant.address}
            </Text>
            <View style={styles.metaRow}>
              <RatingBadge rating={restaurant.rating || 0} />
              {restaurant.priceLevel && (
                <PriceBadge level={restaurant.priceLevel} style={{ marginLeft: Spacing.xs }} />
              )}
              {restaurant.cuisine_type && (
                <CuisineBadge
                  cuisine={restaurant.cuisine_type}
                  style={{ marginLeft: Spacing.xs }}
                />
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Default variant
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.md,
  },
  cardRow: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.base,
    overflow: 'hidden',
    marginRight: Spacing.base,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOverlay: {
    position: 'absolute',
    bottom: Spacing.xs,
    left: Spacing.xs,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: Typography.letterSpacing.tight,
    marginBottom: Spacing.xs,
  },
  address: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },

  // Compact variant
  compactCard: {
    width: 180,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginRight: Spacing.md,
    ...Shadows.base,
  },
  compactImage: {
    width: 180,
    height: 120,
  },
  compactContent: {
    padding: Spacing.md,
  },
  compactName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: Typography.letterSpacing.tight,
  },

  // Featured variant
  featuredCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  featuredImageContainer: {
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: 220,
  },
  featuredStatusOverlay: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  featuredContent: {
    padding: Spacing.lg,
  },
  featuredName: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.black,
    letterSpacing: Typography.letterSpacing.tight,
    marginBottom: Spacing.xs,
  },
  featuredAddress: {
    fontSize: Typography.fontSize.base,
    marginBottom: Spacing.md,
  },
  featuredMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
});
