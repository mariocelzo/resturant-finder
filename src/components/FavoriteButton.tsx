import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator, View } from 'react-native';
import { Restaurant } from '../services/googlePlaces';
import { FavoritesService } from '../services/favoriteService';

interface FavoriteButtonProps {
  restaurant: Restaurant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  onToggle?: (isFavorite: boolean) => void;
}

export default function FavoriteButton({ restaurant, size = 'md', style, onToggle }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

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
      }
    } finally {
      setLoading(false);
    }
  };

  const heart = isFavorite ? '❤️' : '🤍';
  const fontSize = size === 'sm' ? 18 : 22;

  return (
    <TouchableOpacity onPress={handleToggle} disabled={loading} style={[styles.button, style]} accessibilityRole="button" accessibilityLabel={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}>
      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color="#FF6B6B" />
        </View>
      ) : (
        <Text style={[styles.heart, { fontSize }]}>{heart}</Text>
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
  heart: {
    textAlign: 'center',
  },
  loaderWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

