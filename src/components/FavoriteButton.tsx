import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { FavoritesService } from '../services/favoriteService';
import { Restaurant } from '../services/googlePlaces';

interface FavoriteButtonProps {
  restaurant: Restaurant;
  size?: 'small' | 'medium' | 'large';
  onToggle?: (isFavorite: boolean) => void;
  showText?: boolean;
}

export default function FavoriteButton({ 
  restaurant, 
  size = 'medium', 
  onToggle,
  showText = false 
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Controllo iniziale se è preferito
  useEffect(() => {
    checkFavoriteStatus();
  }, [restaurant.id]);

  const checkFavoriteStatus = async () => {
    try {
      setInitialLoading(true);
      const favorite = await FavoritesService.isFavorite(restaurant.id);
      setIsFavorite(favorite);
      console.log(`❤️ ${restaurant.name} è preferito:`, favorite);
    } catch (error) {
      console.error('❌ Errore controllo preferito:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleToggle = async () => {
    if (loading) return; // Previene doppi tap

    try {
      setLoading(true);
      console.log(`💫 Toggle preferito per ${restaurant.name}`);

      const success = await FavoritesService.toggleFavorite(restaurant);
      
      if (success) {
        const newFavoriteStatus = !isFavorite;
        setIsFavorite(newFavoriteStatus);
        
        // Callback per il componente parent
        onToggle?.(newFavoriteStatus);
        
        console.log(`✅ Toggle completato: ${restaurant.name} ora è ${newFavoriteStatus ? 'preferito' : 'non preferito'}`);
      } else {
        Alert.alert(
          'Errore',
          'Impossibile aggiornare i preferiti. Riprova più tardi.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Errore toggle preferito:', error);
      Alert.alert(
        'Errore',
        'Si è verificato un errore. Riprova più tardi.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          heart: styles.heartSmall,
          text: styles.textSmall,
        };
      case 'large':
        return {
          container: styles.containerLarge,
          heart: styles.heartLarge,
          text: styles.textLarge,
        };
      default:
        return {
          container: styles.containerMedium,
          heart: styles.heartMedium,
          text: styles.textMedium,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  // Loading iniziale
  if (initialLoading) {
    return (
      <TouchableOpacity 
        style={[styles.container, sizeStyles.container, styles.disabled]}
        disabled
      >
        <ActivityIndicator size="small" color="#ccc" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        sizeStyles.container,
        isFavorite && styles.containerFavorite,
        loading && styles.disabled
      ]}
      onPress={handleToggle}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={isFavorite ? '#fff' : '#FF6B6B'} 
        />
      ) : (
        <>
          <Text 
            style={[
              styles.heart,
              sizeStyles.heart,
              isFavorite ? styles.heartFavorite : styles.heartNotFavorite
            ]}
          >
            {isFavorite ? '❤️' : '🤍'}
          </Text>
          {showText && (
            <Text 
              style={[
                styles.text,
                sizeStyles.text,
                isFavorite ? styles.textFavorite : styles.textNotFavorite
              ]}
            >
              {isFavorite ? 'Preferito' : 'Aggiungi'}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  containerSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 32,
    minHeight: 32,
  },
  containerMedium: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 40,
    minHeight: 40,
  },
  containerLarge: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 48,
    minHeight: 48,
  },
  containerFavorite: {
    backgroundColor: '#FFE8E8',
    borderColor: '#FF6B6B',
  },
  disabled: {
    opacity: 0.6,
  },
  heart: {
    textAlign: 'center',
  },
  heartSmall: {
    fontSize: 16,
  },
  heartMedium: {
    fontSize: 20,
  },
  heartLarge: {
    fontSize: 24,
  },
  heartFavorite: {
    // Il cuore rosso è già nell'emoji ❤️
  },
  heartNotFavorite: {
    // Il cuore bianco è già nell'emoji 🤍
  },
  text: {
    fontWeight: '600',
    marginLeft: 6,
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 14,
  },
  textFavorite: {
    color: '#FF6B6B',
  },
  textNotFavorite: {
    color: '#666',
  },
});