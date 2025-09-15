import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator 
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { searchNearbyRestaurants, Restaurant } from '../services/googlePlaces';
import { RootStackParamList } from '../../App';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function RestaurantListScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    console.log('🚀 RestaurantListScreen mounted');
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    console.log('🔄 Caricamento ristoranti iniziato...');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('📍 Permission status:', status);
      
      if (status !== 'granted') {
        console.log('🏠 Usando posizione default (Centro Napoli)');
        const defaultRestaurants = await searchNearbyRestaurants(40.8522, 14.2681);
        console.log('🍽️ Ristoranti trovati:', defaultRestaurants.length);
        console.log('📋 Primi 2 ristoranti:', defaultRestaurants.slice(0, 2));
        setRestaurants(defaultRestaurants);
      } else {
        console.log('📱 Permesso concesso, ottenendo posizione...');
        const location = await Location.getCurrentPositionAsync({});
        console.log('📍 Posizione corrente:', {
          lat: location.coords.latitude,
          lng: location.coords.longitude
        });
        const nearbyRestaurants = await searchNearbyRestaurants(
          location.coords.latitude,
          location.coords.longitude
        );
        console.log('🍽️ Ristoranti trovati:', nearbyRestaurants.length);
        setRestaurants(nearbyRestaurants);
      }
    } catch (error) {
      console.error('❌ Errore caricamento ristoranti:', error);
      // Fallback con dati mock in caso di errore
      console.log('🔄 Usando fallback con dati mock...');
      const fallbackRestaurants = await searchNearbyRestaurants(40.8522, 14.2681);
      setRestaurants(fallbackRestaurants);
    } finally {
      console.log('✅ Caricamento completato');
      setLoading(false);
    }
  };

  const renderRestaurant = ({ item }: { item: Restaurant }) => {
    console.log('🎨 Rendering restaurant:', item.name);
    return (
      <TouchableOpacity 
        style={styles.restaurantCard}
        onPress={() => navigation.navigate('RestaurantDetail', { restaurant: item })}
      >
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{item.name}</Text>
          <Text style={styles.restaurantAddress}>{item.address}</Text>
          <View style={styles.restaurantMeta}>
            <Text style={styles.rating}>⭐ {item.rating}/5</Text>
            <Text style={styles.priceLevel}>
              {'€'.repeat(item.priceLevel || 1)}
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.isOpen ? '#4CAF50' : '#F44336' }
            ]}>
              <Text style={styles.statusText}>
                {item.isOpen ? 'Aperto' : 'Chiuso'}
              </Text>
            </View>
          </View>
          <Text style={styles.cuisine}>{item.cuisine_type}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  console.log('🔍 Stato attuale:', {
    loading,
    restaurantsCount: restaurants.length,
    hasRestaurants: restaurants.length > 0
  });

  if (loading) {
    console.log('⏳ Mostrando loading...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Cercando ristoranti...</Text>
      </View>
    );
  }

  if (restaurants.length === 0) {
    console.log('❌ Nessun ristorante trovato, mostrando messaggio vuoto');
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>🍽️ Nessun ristorante trovato</Text>
        <Text style={styles.emptySubtitle}>Riprova più tardi</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadRestaurants}>
          <Text style={styles.retryText}>Riprova</Text>
        </TouchableOpacity>
      </View>
    );
  }

  console.log('✅ Mostrando lista con', restaurants.length, 'ristoranti');
  return (
    <View style={styles.container}>
      <FlatList
        data={restaurants}
        renderItem={renderRestaurant}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  restaurantCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  priceLevel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  cuisine: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
});