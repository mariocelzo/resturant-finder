import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { searchNearbyRestaurants, Restaurant } from '../services/googlePlaces';

function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]); // FIXED: Dichiarata variabile restaurants
  const [loading, setLoading] = useState(true); // FIXED: Aggiunto stato loading
  const [error, setError] = useState<string | null>(null); // FIXED: Aggiunto stato errore

  useEffect(() => {
    console.log('🗺️ MapScreen mounted');
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    console.log('📍 Richiedendo posizione...');
    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('🔐 Permission status:', status);
      
      if (status !== 'granted') {
        console.log('🏠 Usando posizione default (Centro Napoli)');
        const defaultLocation = {
          coords: {
            latitude: 40.8522,
            longitude: 14.2681,
            altitude: null,
            accuracy: null,
            heading: null,
            speed: null,
            altitudeAccuracy: null,
          },
          timestamp: Date.now(),
        };
        setLocation(defaultLocation);
        
        // Cerca ristoranti con posizione default
        const nearbyRestaurants = await searchNearbyRestaurants(40.8522, 14.2681);
        console.log('🍽️ Ristoranti trovati (default):', nearbyRestaurants.length);
        setRestaurants(nearbyRestaurants);
      } else {
        console.log('📱 Permesso concesso, ottenendo posizione...');
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        console.log('📍 Posizione ottenuta:', {
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude
        });
        
        setLocation(currentLocation);
        
        // Cerca ristoranti nelle vicinanze
        const nearbyRestaurants = await searchNearbyRestaurants(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude
        );
        console.log('🍽️ Ristoranti trovati:', nearbyRestaurants.length);
        setRestaurants(nearbyRestaurants);
      }
    } catch (error) {
      console.error('❌ Error getting location:', error);
      setError('Impossibile ottenere la posizione');
      
      // Fallback a posizione default in caso di errore
      const defaultLocation = {
        coords: {
          latitude: 40.8522,
          longitude: 14.2681,
          altitude: null,
          accuracy: null,
          heading: null,
          speed: null,
          altitudeAccuracy: null,
        },
        timestamp: Date.now(),
      };
      setLocation(defaultLocation);
      
      const fallbackRestaurants = await searchNearbyRestaurants(40.8522, 14.2681);
      setRestaurants(fallbackRestaurants);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Gestione stati di loading e errore
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Caricando mappa...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>❌ Impossibile caricare la mappa</Text>
        {error && <Text style={styles.errorDetails}>{error}</Text>}
      </View>
    );
  }

  console.log('🗺️ Rendering MapView con', restaurants.length, 'ristoranti');

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            coordinate={{
              latitude: restaurant.latitude,
              longitude: restaurant.longitude,
            }}
            title={restaurant.name}
            description={`⭐ ${restaurant.rating}/5 • ${restaurant.cuisine_type}`}
            pinColor={restaurant.isOpen ? '#4CAF50' : '#F44336'}
          />
        ))}
      </MapView>
      
      {/* Info overlay */}
      <View style={styles.infoOverlay}>
        <Text style={styles.infoText}>
          📍 {restaurants.length} ristoranti trovati
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorDetails: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  infoOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});

export default MapScreen;