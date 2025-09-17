import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ListRenderItem,
  SafeAreaView,
  Image,
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { searchNearbyRestaurants, Restaurant } from '../services/googlePlaces';
import { RootStackParamList, TabParamList } from '../../App';
import FilterModal, { FilterOptions } from '../components/FilterModal';
import FavoriteButton from '../components/FavoriteButton';
import { geocodeLocation } from '../services/googlePlaces';
import { useLocationSelection } from '../contexts/LocationContext';

const NAPLES = { LAT: 40.8522, LNG: 14.2681 };

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Lista'>,
  StackNavigationProp<RootStackParamList>
>;

// Estendi Restaurant per includere distance
interface RestaurantWithDistance extends Restaurant {
  distance?: number;
}

export default function RestaurantListScreen() {
  const [restaurants, setRestaurants] = useState<RestaurantWithDistance[]>([]);
  const [recommended, setRecommended] = useState<RestaurantWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchCenter, setSearchCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const navigation = useNavigation<NavigationProp>();
  const { locationQuery: selectedQuery, coordinates: selectedCoords } = useLocationSelection();

  // Stato filtri con valori di default
  const [filters, setFilters] = useState<FilterOptions>({
    cuisineTypes: ['Tutti'],
    priceRange: [1, 4],
    minRating: 0,
    maxDistance: 5000,
    showOnlyOpen: false,
    sortBy: 'rating',
    locationQuery: selectedQuery || '',
  });

  useEffect(() => {
    console.log('🚀 RestaurantListScreen mounted');
    loadRestaurants();
  }, []);

  // Sync con LocationContext: se cambia località selezionata, ricarica
  useEffect(() => {
    setFilters(prev => ({ ...prev, locationQuery: selectedQuery || '' }));
    // trigger reload con le nuove coordinate
    loadRestaurants();
  }, [selectedQuery, selectedCoords]);

  const loadRestaurants = async (showRefreshLoader = false) => {
    console.log('🔄 Caricamento ristoranti iniziato...');
    if (showRefreshLoader) setRefreshing(true);
    else setLoading(true);
    
    try {
      let lat: number, lng: number;

      const queryStr = ((selectedQuery ?? filters.locationQuery) || '').trim();
      if (queryStr) {
        console.log('🧭 Geocoding per località manuale:', queryStr);
        if (selectedCoords) {
          lat = selectedCoords.latitude;
          lng = selectedCoords.longitude;
          console.log('📍 Uso coordinate selezionate da contesto:', lat, lng);
        } else {
          const geo = await geocodeLocation(queryStr);
          if (!geo) {
            throw new Error('Località non trovata');
          }
          lat = geo.latitude;
          lng = geo.longitude;
          console.log('📍 Località geocodata:', geo.formattedAddress, lat, lng);
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('🔐 Permission status:', status);
        if (status !== 'granted') {
          console.log('🏠 Usando posizione default (Centro Napoli)');
          lat = NAPLES.LAT;
          lng = NAPLES.LNG;
        } else {
          console.log('📱 Permesso concesso, ottenendo posizione...');
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = location.coords.latitude;
          lng = location.coords.longitude;
          console.log('📍 Posizione corrente:', { lat, lng });
        }
      }
      // Se stiamo usando i mock (niente API key) e siamo molto lontani da Napoli,
      // usa Napoli come base per evitare che tutti i risultati risultino "troppo distanti".
      const isMockEnv = !process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
      const farFromNaples = calculateDistance(lat, lng, NAPLES.LAT, NAPLES.LNG) > 100000; // > 100km
      const effectiveLat = isMockEnv && farFromNaples ? NAPLES.LAT : lat;
      const effectiveLng = isMockEnv && farFromNaples ? NAPLES.LNG : lng;

      if (isMockEnv && farFromNaples) {
        console.log('🌍 Ambiente mock e posizione lontana: uso Napoli come origine per ricerca/filtri');
      }

      setUserLocation({ latitude: effectiveLat, longitude: effectiveLng });
      setSearchCenter({ latitude: effectiveLat, longitude: effectiveLng });

      const nearbyRestaurants = await searchNearbyRestaurants(effectiveLat, effectiveLng, filters.maxDistance);
      console.log('🍽️ Ristoranti trovati:', nearbyRestaurants.length);
      
      // Calcola distanze per ogni ristorante
      const restaurantsWithDistance: RestaurantWithDistance[] = nearbyRestaurants.map(restaurant => ({
        ...restaurant,
        distance: calculateDistance(effectiveLat, effectiveLng, restaurant.latitude, restaurant.longitude)
      }));
      // Se le distanze risultano troppo grandi rispetto alla posizione corrente
      // e siamo lontani da Napoli, ricalcola le distanze usando Napoli come origine
      const minDistance = Math.min(
        ...restaurantsWithDistance.map(r => r.distance ?? Infinity)
      );
      if (farFromNaples && minDistance > 100000) { // > 100km
        console.log('🧭 Distanze elevate; ricalcolo rispetto a Napoli (mock).');
        const recalculated: RestaurantWithDistance[] = nearbyRestaurants.map(r => ({
          ...r,
          distance: calculateDistance(NAPLES.LAT, NAPLES.LNG, r.latitude, r.longitude)
        }));
        setUserLocation({ latitude: NAPLES.LAT, longitude: NAPLES.LNG });
        setSearchCenter({ latitude: NAPLES.LAT, longitude: NAPLES.LNG });
        setRestaurants(recalculated);
      } else {
        setRestaurants(restaurantsWithDistance);
      }
    } catch (error) {
      console.error('❌ Errore caricamento ristoranti:', error);
      Alert.alert(
        'Errore',
        'Impossibile caricare i ristoranti. Riprova più tardi.',
        [{ text: 'OK' }]
      );
      
      // Fallback con dati mock
      console.log('🔄 Usando fallback con dati mock...');
      const fallbackRestaurants = await searchNearbyRestaurants(40.8522, 14.2681);
      const restaurantsWithDistance: RestaurantWithDistance[] = fallbackRestaurants.map(restaurant => ({
        ...restaurant,
        distance: calculateDistance(40.8522, 14.2681, restaurant.latitude, restaurant.longitude)
      }));
      setRestaurants(restaurantsWithDistance);
    } finally {
      console.log('✅ Caricamento completato');
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filtri e ordinamento ristoranti con useMemo per performance
  const filteredRestaurants = useMemo(() => {
    console.log('🔍 Applicando filtri:', filters);
    console.log('🍽️ Ristoranti totali prima del filtro:', restaurants.length);
    
    let filtered = restaurants.filter(restaurant => {
      // Debug per ogni ristorante
      console.log(`🔍 Controllando ${restaurant.name}:`, {
        cuisine: restaurant.cuisine_type,
        priceLevel: restaurant.priceLevel,
        rating: restaurant.rating,
        distance: restaurant.distance,
        isOpen: restaurant.isOpen
      });

      // Filtro per tipo cucina
      if (!filters.cuisineTypes.includes('Tutti')) {
        const cuisineMatch = filters.cuisineTypes.some(filterCuisine => 
          restaurant.cuisine_type?.toLowerCase().includes(filterCuisine.toLowerCase()) ||
          filterCuisine.toLowerCase() === restaurant.cuisine_type?.toLowerCase()
        );
        if (!cuisineMatch) {
          console.log(`❌ ${restaurant.name}: cucina non corrisponde`);
          return false;
        }
      }
      
      // Filtro per fascia prezzo
      if (restaurant.priceLevel) {
        if (restaurant.priceLevel < filters.priceRange[0] || restaurant.priceLevel > filters.priceRange[1]) {
          console.log(`❌ ${restaurant.name}: prezzo fuori range`);
          return false;
        }
      }
      
      // Filtro per rating minimo
      if (restaurant.rating < filters.minRating) {
        console.log(`❌ ${restaurant.name}: rating troppo basso`);
        return false;
      }
      
      // Filtro per distanza massima
      if (restaurant.distance && restaurant.distance > filters.maxDistance) {
        console.log(`❌ ${restaurant.name}: troppo distante`);
        return false;
      }
      
      // Filtro solo aperti
      if (filters.showOnlyOpen && !restaurant.isOpen) {
        console.log(`❌ ${restaurant.name}: chiuso`);
        return false;
      }
      
      console.log(`✅ ${restaurant.name}: passa tutti i filtri`);
      return true;
    });

    // Ordinamento
    switch (filters.sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        console.log('📊 Ordinato per rating');
        break;
      case 'distance':
        filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        console.log('📊 Ordinato per distanza');
        break;
      case 'price':
        filtered.sort((a, b) => (a.priceLevel || 1) - (b.priceLevel || 1));
        console.log('📊 Ordinato per prezzo');
        break;
    }
    
    console.log('📊 RISULTATO FILTRI:', filtered.length, 'su', restaurants.length, 'ristoranti');
    console.log('📋 Primi 3 risultati:', filtered.slice(0, 3).map(r => ({
      name: r.name, 
      cuisine: r.cuisine_type, 
      rating: r.rating,
      isOpen: r.isOpen
    })));
    
    return filtered;
  }, [restaurants, filters]);

  // Calcola suggerimenti fuori dal range selezionato
  const computeRecommended = async () => {
    try {
      if (!searchCenter) return;
      // Estendi il raggio fino a 50km (limite Nearby Search)
      const recRadius = Math.min(50000, Math.max(filters.maxDistance * 1.5, filters.maxDistance + 5000));
      const recNearby = await searchNearbyRestaurants(searchCenter.latitude, searchCenter.longitude, recRadius, 60);
      const recWithDistance: RestaurantWithDistance[] = recNearby.map(r => ({
        ...r,
        distance: calculateDistance(searchCenter.latitude, searchCenter.longitude, r.latitude, r.longitude)
      }));
      const mainIds = new Set(restaurants.map(r => r.id));
      // Applica stessi filtri ma senza vincolo di distanza, e tieni solo quelli oltre il range scelto
      let recFiltered = recWithDistance.filter(r => {
        if (mainIds.has(r.id)) return false;
        if (filters.cuisineTypes && !filters.cuisineTypes.includes('Tutti')) {
          const match = filters.cuisineTypes.some(c => r.cuisine_type?.toLowerCase().includes(c.toLowerCase()));
          if (!match) return false;
        }
        if (r.priceLevel) {
          if (r.priceLevel < filters.priceRange[0] || r.priceLevel > filters.priceRange[1]) return false;
        }
        if (r.rating < filters.minRating) return false;
        if (filters.showOnlyOpen && !r.isOpen) return false;
        // Solo oltre il range corrente
        return (r.distance ?? Infinity) > (filters.maxDistance + 500); // piccolo buffer di 0.5km per evitare borderline
      });
      recFiltered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setRecommended(recFiltered.slice(0, 20));
    } catch (e) {
      console.error('❌ Errore calcolo suggeriti:', e);
      setRecommended([]);
    }
  };

  useEffect(() => {
    // Se risultati pochi o nulli, calcola suggeriti
    if (!loading && restaurants.length > 0 && filteredRestaurants.length < 5) {
      computeRecommended();
    } else if (filteredRestaurants.length >= 5) {
      setRecommended([]);
    }
  }, [loading, restaurants, filteredRestaurants.length, filters]);

  const handleApplyFilters = (newFilters: FilterOptions) => {
    console.log('✅ Applicando nuovi filtri:', newFilters);
    setFilters(newFilters);
    
    // Se la distanza o la località sono cambiate, ricarica i dati
    if (newFilters.maxDistance !== filters.maxDistance || newFilters.locationQuery !== filters.locationQuery) {
      console.log('🔄 Distanza cambiata, ricaricando dati...');
      loadRestaurants();
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.cuisineTypes.length > 1 || !filters.cuisineTypes.includes('Tutti')) count++;
    if (filters.priceRange[0] > 1 || filters.priceRange[1] < 4) count++;
    if (filters.minRating > 0) count++;
    if (filters.maxDistance < 5000) count++;
    if (filters.showOnlyOpen) count++;
    if (filters.sortBy !== 'rating') count++;
    return count;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Raggio Terra in metri
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    if (distance < 1000) return `${Math.round(distance)}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  };

  // Debug helper to ensure units are meters
  useEffect(() => {
    console.log('🧪 Distanza massima selezionata (m):', filters.maxDistance);
  }, [filters.maxDistance]);

  const renderRestaurant: ListRenderItem<RestaurantWithDistance> = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.restaurantCard}
        onPress={() => navigation.navigate('RestaurantDetail', { restaurant: item })}
        activeOpacity={0.85}
      >
        <View style={styles.cardRow}>
          <View style={styles.imageContainer}>
            {item.photoUrl ? (
              <Image source={{ uri: item.photoUrl }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Image source={require('../../assets/NearBiteLogo.png')} style={styles.imageLogo} />
              </View>
            )}
            <View style={[styles.statusChip, { backgroundColor: item.isOpen ? '#E8F5E9' : '#FDECEA' }]}> 
              <Text style={[styles.statusChipText, { color: item.isOpen ? '#2E7D32' : '#C62828' }]}>
                {item.isOpen ? 'Aperto' : 'Chiuso'}
              </Text>
            </View>
            <FavoriteButton restaurant={item} size="sm" style={styles.favoriteOverlay} />
          </View>
          <View style={styles.infoWrap}>
            <Text style={styles.restaurantName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.restaurantAddress} numberOfLines={2}>{item.address}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaChip}><Text style={styles.metaChipText}>⭐ {item.rating.toFixed(1)}</Text></View>
              {Boolean(item.distance) && (
                <View style={styles.metaChip}><Text style={styles.metaChipText}>📍 {formatDistance(item.distance)}</Text></View>
              )}
              <View style={styles.metaChip}><Text style={styles.metaChipText}>{'€'.repeat(item.priceLevel || 1)}</Text></View>
            </View>
            {!!item.cuisine_type && <Text style={styles.cuisine}>{item.cuisine_type}</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          📍 {filteredRestaurants.length} ristoranti trovati
          {getActiveFiltersCount() > 0 && ` • ${getActiveFiltersCount()} filtri attivi`}
          {filters.locationQuery?.trim() ? ` • Zona: ${filters.locationQuery}` : ''}
        </Text>
        <TouchableOpacity 
          style={[
            styles.filterButton,
            getActiveFiltersCount() > 0 && styles.filterButtonActive
          ]}
          onPress={() => {
            console.log('🔍 Aprendo filtri...');
            setShowFilters(true);
          }}
        >
          <Text style={[
            styles.filterButtonText,
            getActiveFiltersCount() > 0 && styles.filterButtonTextActive
          ]}>
            🔍 Filtri {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleRefresh = () => {
    console.log('🔄 Pull to refresh');
    loadRestaurants(true);
  };

  console.log('🔍 Stato attuale:', {
    loading,
    restaurantsCount: restaurants.length,
    filteredCount: filteredRestaurants.length,
    activeFilters: getActiveFiltersCount(),
    showFilters
  });

  if (loading) {
    console.log('⏳ Mostrando loading...');
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Cercando ristoranti...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (restaurants.length === 0) {
    console.log('❌ Nessun ristorante trovato');
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>🍽️ Nessun ristorante trovato</Text>
          <Text style={styles.emptySubtitle}>Riprova più tardi</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadRestaurants()}>
            <Text style={styles.retryText}>Riprova</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (filteredRestaurants.length === 0 && restaurants.length > 0) {
    console.log('🔍 Nessun risultato per i filtri correnti — mostro suggerimenti');
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <FlatList
            data={recommended}
            renderItem={renderRestaurant}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={
              <View>
                {renderHeader()}
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsTitle}>🔍 Nessun risultato</Text>
                  <Text style={styles.noResultsSubtitle}>Prova a modificare i filtri di ricerca</Text>
                  <TouchableOpacity 
                    style={styles.resetFiltersButton}
                    onPress={() => {
                      const resetFilters: FilterOptions = {
                        cuisineTypes: ['Tutti'],
                        priceRange: [1, 4],
                        minRating: 0,
                        maxDistance: 5000,
                        showOnlyOpen: false,
                        sortBy: 'rating',
                        locationQuery: '',
                      };
                      setFilters(resetFilters);
                    }}
                  >
                    <Text style={styles.resetFiltersText}>🔄 Reset Filtri</Text>
                  </TouchableOpacity>
                </View>
                {recommended.length > 0 && (
                  <View style={styles.recoHeader}>
                    <Text style={styles.recoTitle}>
                      Ti consigliamo vicino {filters.locationQuery?.trim() ? filters.locationQuery : 'alla tua posizione'}
                    </Text>
                  </View>
                )}
              </View>
            }
            ListEmptyComponent={
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsSubtitle}>Nessun suggerimento disponibile</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
          <FilterModal
            visible={showFilters}
            onClose={() => setShowFilters(false)}
            onApplyFilters={handleApplyFilters}
            currentFilters={filters}
          />
        </View>
      </SafeAreaView>
    );
  }

  console.log('✅ Mostrando lista con', filteredRestaurants.length, 'ristoranti filtrati');
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
      <FlatList
        data={filteredRestaurants}
        renderItem={renderRestaurant}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={
          recommended.length > 0 ? (
            <View style={{ paddingTop: 8 }}>
              <View style={styles.recoHeader}>
                <Text style={styles.recoTitle}>
                  Ti consigliamo vicino {filters.locationQuery?.trim() ? filters.locationQuery : 'alla tua posizione'}
                </Text>
              </View>
              {recommended.map((r) => (
                <TouchableOpacity 
                  key={`reco_${r.id}`}
                  style={styles.restaurantCard}
                  onPress={() => navigation.navigate('RestaurantDetail', { restaurant: r })}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardRow}>
                    <View style={styles.imageContainer}>
                      {r.photoUrl ? (
                        <Image source={{ uri: r.photoUrl }} style={styles.image} />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <Image source={require('../../assets/NearBiteLogo.png')} style={styles.imageLogo} />
                        </View>
                      )}
                      <View style={[styles.statusChip, { backgroundColor: r.isOpen ? '#E8F5E9' : '#FDECEA' }]}> 
                        <Text style={[styles.statusChipText, { color: r.isOpen ? '#2E7D32' : '#C62828' }]}>
                          {r.isOpen ? 'Aperto' : 'Chiuso'}
                        </Text>
                      </View>
                      <FavoriteButton restaurant={r} size="sm" style={styles.favoriteOverlay} />
                    </View>
                    <View style={styles.infoWrap}>
                      <Text style={styles.restaurantName} numberOfLines={1}>{r.name}</Text>
                      <Text style={styles.restaurantAddress} numberOfLines={2}>{r.address}</Text>
                      <View style={styles.metaRow}>
                        <View style={styles.metaChip}><Text style={styles.metaChipText}>⭐ {r.rating.toFixed(1)}</Text></View>
                        {Boolean(r.distance) && (
                          <View style={styles.metaChip}><Text style={styles.metaChipText}>📍 {formatDistance(r.distance)}</Text></View>
                        )}
                        <View style={styles.metaChip}><Text style={styles.metaChipText}>{'€'.repeat(r.priceLevel || 1)}</Text></View>
                      </View>
                      {!!r.cuisine_type && <Text style={styles.cuisine}>{r.cuisine_type}</Text>}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF6B6B"
            colors={['#FF6B6B']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
      
      <FilterModal
        visible={showFilters}
        onClose={() => {
          console.log('❌ Chiudendo filtri');
          setShowFilters(false);
        }}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
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
    textAlign: 'center',
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
  headerContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  filterButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  restaurantCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardRow: { flexDirection: 'row' },
  imageContainer: { width: 96, height: 96, borderRadius: 12, overflow: 'hidden', marginRight: 12, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, backgroundColor: '#FFF3F2', alignItems: 'center', justifyContent: 'center' },
  imageLogo: { width: 48, height: 48, resizeMode: 'contain', opacity: 0.8 },
  favoriteOverlay: { position: 'absolute', top: 6, right: 6 },
  infoWrap: { flex: 1, justifyContent: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaChip: { backgroundColor: '#FFF0ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 6 },
  metaChipText: { color: '#FF6B6B', fontWeight: '600', fontSize: 12 },
  statusChip: { position: 'absolute', bottom: 6, left: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusChipText: { fontSize: 10, fontWeight: '700' },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  cuisine: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 6,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  resetFiltersButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetFiltersText: {
    color: 'white',
    fontWeight: '600',
  },
  recoHeader: {
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  recoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
});
