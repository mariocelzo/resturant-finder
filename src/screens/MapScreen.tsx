import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Text, ActivityIndicator, Modal, TextInput, TouchableOpacity } from 'react-native';
import MapView, { Marker, Region } from '../components/MapView';
import * as Location from 'expo-location';
import { searchNearbyRestaurants, Restaurant, geocodeLocation, placesAutocomplete, getPlaceDetails } from '../services/googlePlaces';
import { Ionicons } from '@expo/vector-icons';
import { useLocationSelection } from '../contexts/LocationContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import MapPreviewCard from '../components/MapPreviewCard';
import { useCurrentLocation } from '../hooks/useCurrentLocation';

function MapScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]); // FIXED: Dichiarata variabile restaurants
  const [loading, setLoading] = useState(true); // FIXED: Aggiunto stato loading
  const [error, setError] = useState<string | null>(null); // FIXED: Aggiunto stato errore
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [suggestions, setSuggestions] = useState<{ description: string; placeId: string }[]>([]);
  const { setManualLocation, locationQuery: selectedQuery, coordinates: selectedCoords } = useLocationSelection();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const { getCurrentLocation: fetchCurrentCoords } = useCurrentLocation();
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const skipNextRegionChangeRef = useRef<boolean>(false);
  const regionDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const prevRegionRef = useRef<Region | null>(null);

  useEffect(() => {
    console.log('🗺️ MapScreen mounted');
    if (selectedCoords) {
      const fakeLoc = {
        coords: {
          latitude: selectedCoords.latitude,
          longitude: selectedCoords.longitude,
          altitude: null,
          accuracy: null,
          heading: null,
          speed: null,
          altitudeAccuracy: null,
        },
        timestamp: Date.now(),
      } as unknown as Location.LocationObject;
      setLocation(fakeLoc);
      skipNextRegionChangeRef.current = true;
      setRegion({ latitude: selectedCoords.latitude, longitude: selectedCoords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
      const lat = selectedCoords.latitude; const lng = selectedCoords.longitude;
      if (!lastCoordsRef.current || lastCoordsRef.current.lat !== lat || lastCoordsRef.current.lng !== lng) {
        lastCoordsRef.current = { lat, lng };
        (async () => {
          const nearby = await searchNearbyRestaurants(lat, lng);
          setRestaurants(nearby);
        })();
      }
    } else {
      getCurrentLocation();
    }
  }, []);

  // Se cambia la località selezionata dai filtri, aggiorna mappa e risultati
  useEffect(() => {
    if (!selectedCoords) return;
    const lat = selectedCoords.latitude; const lng = selectedCoords.longitude;
    const fakeLoc = { coords: { latitude: lat, longitude: lng, altitude: null, accuracy: null, heading: null, speed: null, altitudeAccuracy: null }, timestamp: Date.now(), } as unknown as Location.LocationObject;
    setLocation(fakeLoc);
    skipNextRegionChangeRef.current = true;
    setRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    if (!lastCoordsRef.current || lastCoordsRef.current.lat !== lat || lastCoordsRef.current.lng !== lng) {
      lastCoordsRef.current = { lat, lng };
      (async () => {
        const nearby = await searchNearbyRestaurants(lat, lng);
        setRestaurants(nearby);
      })();
    }
  }, [selectedCoords]);

  // Autocomplete: aggiorna suggerimenti quando cambia query
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      const s = await placesAutocomplete(q);
      setSuggestions(s);
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

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
        skipNextRegionChangeRef.current = true;
        setRegion({ latitude: 40.8522, longitude: 14.2681, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        
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
        skipNextRegionChangeRef.current = true;
        setRegion({ latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        
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

  // Ricerca automatica al termine di pan/zoom
  const handleRegionChangeComplete = (r: Region) => {
    if (skipNextRegionChangeRef.current) {
      skipNextRegionChangeRef.current = false;
      prevRegionRef.current = r;
      return;
    }

    setSelectedRestaurant(null);
    setRegion(r);

    // Evita fetch se movimento minimo e zoom simile
    if (prevRegionRef.current) {
      const prev = prevRegionRef.current;
      const dLat = (r.latitude - prev.latitude) * Math.PI / 180;
      const dLon = (r.longitude - prev.longitude) * Math.PI / 180;
      const a = Math.sin(dLat/2) ** 2 + Math.cos(r.latitude * Math.PI / 180) * Math.cos(prev.latitude * Math.PI / 180) * Math.sin(dLon/2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const meters = 6371000 * c;
      const zoomChange = Math.abs((r.latitudeDelta - prev.latitudeDelta) / (prev.latitudeDelta || 1));
      if (meters < 150 && zoomChange < 0.15) {
        prevRegionRef.current = r;
        return;
      }
    }
    prevRegionRef.current = r;

    if (regionDebounceRef.current) clearTimeout(regionDebounceRef.current);
    regionDebounceRef.current = setTimeout(async () => {
      const approxRadius = Math.min(50000, Math.max(1000, r.latitudeDelta * 111000 * 0.5));
      const data = await searchNearbyRestaurants(r.latitude, r.longitude, approxRadius);
      setRestaurants(data);
    }, 400);
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
        region={region || { latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
        showsUserLocation
        showsMyLocationButton
        onRegionChangeComplete={handleRegionChangeComplete}
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
            onPress={() => {
              if (selectedRestaurant && selectedRestaurant.id === restaurant.id) {
                navigation.navigate('RestaurantDetail', { restaurant });
              } else {
                setSelectedRestaurant(restaurant);
              }
            }}
          />
        ))}
      </MapView>
      
      {/* Info overlay */}
      <View style={styles.infoOverlay}>
        <Text style={styles.infoText}>📍 {restaurants.length} ristoranti trovati</Text>
        <TouchableOpacity style={styles.searchIconBtn} onPress={() => setSearchVisible(true)}>
          <Ionicons name="search" size={18} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      {/* Mini preview del ristorante selezionato */}
      {selectedRestaurant && (
        <MapPreviewCard
          restaurant={selectedRestaurant}
          onClose={() => setSelectedRestaurant(null)}
          onPress={() => navigation.navigate('RestaurantDetail', { restaurant: selectedRestaurant })}
        />
      )}

      {/* Modal di ricerca località */}
      <Modal visible={searchVisible} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Scegli località</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Es. Napoli, Italia"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setSearchVisible(false)}>
                <Text style={styles.modalCancelText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSearch, { backgroundColor: '#f0f0f0', marginRight: 8 }]}
                onPress={async () => {
                  const cur = await fetchCurrentCoords();
                  if (!cur) return;
                  const fakeLoc = { coords: { latitude: cur.latitude, longitude: cur.longitude, altitude: null, accuracy: null, heading: null, speed: null, altitudeAccuracy: null }, timestamp: Date.now(), } as unknown as Location.LocationObject;
                  setLocation(fakeLoc);
                  skipNextRegionChangeRef.current = true;
                  setRegion({ latitude: cur.latitude, longitude: cur.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
                  const nearby = await searchNearbyRestaurants(cur.latitude, cur.longitude);
                  setRestaurants(nearby);
                  setManualLocation('Posizione attuale', { latitude: cur.latitude, longitude: cur.longitude, formattedAddress: 'Posizione attuale' });
                  setSearchVisible(false);
                }}
              >
                <Text style={[styles.modalSearchText, { color: '#333' }]}>📱 Attuale</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSearch}
                onPress={async () => {
                  const q = searchQuery.trim();
                  if (!q) return;
                  const geo = await geocodeLocation(q);
                  if (!geo) { Alert.alert('Località non trovata', 'Prova a essere più specifico.'); return; }
                  const fakeLoc = { coords: { latitude: geo.latitude, longitude: geo.longitude, altitude: null, accuracy: null, heading: null, speed: null, altitudeAccuracy: null }, timestamp: Date.now(), } as unknown as Location.LocationObject;
                  setLocation(fakeLoc);
                  const nearby = await searchNearbyRestaurants(geo.latitude, geo.longitude);
                  setRestaurants(nearby);
                  skipNextRegionChangeRef.current = true;
                  setRegion({ latitude: geo.latitude, longitude: geo.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
                  setManualLocation(q, { latitude: geo.latitude, longitude: geo.longitude, formattedAddress: geo.formattedAddress });
                  setSearchVisible(false);
                }}
              >
                <Text style={styles.modalSearchText}>Cerca</Text>
              </TouchableOpacity>
            </View>
            {suggestions.length > 0 && (
              <View style={{ marginTop: 8 }}>
                {suggestions.map(s => (
                  <TouchableOpacity
                    key={s.placeId}
                    onPress={async () => {
                      const details = await getPlaceDetails(s.placeId);
                      if (!details) return;
                      const fakeLoc = { coords: { latitude: details.latitude, longitude: details.longitude, altitude: null, accuracy: null, heading: null, speed: null, altitudeAccuracy: null }, timestamp: Date.now(), } as unknown as Location.LocationObject;
                      setLocation(fakeLoc);
                      skipNextRegionChangeRef.current = true;
                      setRegion({ latitude: details.latitude, longitude: details.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
                      const nearby = await searchNearbyRestaurants(details.latitude, details.longitude);
                      setRestaurants(nearby);
                      setManualLocation(s.description, { latitude: details.latitude, longitude: details.longitude, formattedAddress: details.formattedAddress });
                      setSearchVisible(false);
                    }}
                    style={{ paddingVertical: 10 }}
                  >
                    <Text style={{ color: '#333' }}>{s.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  searchIconBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '86%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  modalCancelText: { color: '#666', fontSize: 14 },
  modalSearch: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSearchText: { color: '#fff', fontWeight: '700' },
});

export default MapScreen;
