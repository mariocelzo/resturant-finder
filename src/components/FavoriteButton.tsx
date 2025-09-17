import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, ActivityIndicator, View, Animated, Easing } from 'react-native';
import { Restaurant } from '../services/googlePlaces';
import { FavoritesService } from '../services/favoriteService';
import { Ionicons } from '@expo/vector-icons';

interface FavoriteButtonProps {
  restaurant: Restaurant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  onToggle?: (isFavorite: boolean) => void;
}

export default function FavoriteButton({ restaurant, size = 'md', style, onToggle }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const fav = await FavoritesService.isFavorite(restaurant.id);
        if (mounted) setIsFavorite(fav);
      } catch {
        // noop
      }
    })();
    return () => {
      mounted = false;
    };
  }, [restaurant.id]);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const ok = await FavoritesService.toggleFavorite(restaurant);
      if (ok) {
        setIsFavorite((prev) => {
          const next = !prev;
          onToggle?.(next);
          return next;
        });

        // Leggera animazione di rimbalzo
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.15, duration: 120, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4, tension: 120 })
        ]).start();
      }
    } finally {
      setLoading(false);
    }
  };

  const iconName = isFavorite ? 'heart' : 'heart-outline';
  const iconSize = size === 'sm' ? 22 : 26;
  const iconColor = '#FF6B6B';

  return (
    <TouchableOpacity onPress={handleToggle} disabled={loading} style={[styles.button, style]} accessibilityRole="button" accessibilityLabel={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}>
      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color="#FF6B6B" />
        </View>
      ) : (
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name={iconName} size={iconSize} color={iconColor} />
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 32,
    alignItems: 'center',
  },
  loaderWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
