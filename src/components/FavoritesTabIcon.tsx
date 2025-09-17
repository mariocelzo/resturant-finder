import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFavoritesCount } from '../hooks/useFavorites';

interface FavoritesTabIconProps {
  focused: boolean;
  color: string;
}

export default function FavoritesTabIcon({ focused, color }: FavoritesTabIconProps) {
  const { count } = useFavoritesCount();

  return (
    <View style={styles.container}>
      <Text style={{ 
        fontSize: focused ? 22 : 20, 
        color: color 
      }}>
        {focused ? '❤️' : '🤍'}
      </Text>
      
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {count > 99 ? '99+' : count.toString()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

