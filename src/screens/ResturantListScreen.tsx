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
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { searchNearbyRestaurants, Restaurant } from '../services/googlePlaces';
import { RootStackParamList } from '../../App';
import FilterModal, { FilterOptions } from '../components/FilterModal';
import FavoriteButton from '../components/FavoriteButton';

const NAPLES = { LAT: 40.8522, LNG: 14.2681 };

type NavigationProp = StackNavigationProp<RootStackParamList>;

// Estendi Restaurant per includere distance
interface RestaurantWithDistance extends Restaurant {
  distance?: number;
}

export default function RestaurantListScreen() {
  const [restaurants, setRestaurants] = useState<RestaurantWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const navigation = useNavigation<NavigationProp>();

  // Stato filtri con valori di default
  const [filters, setFilters] = useState<FilterOptions>({
    cuisineTypes: ['Tutti'],
    priceRange: [1, 4],
    minRating: 0,
    maxDistance: 5000,
    showOnlyOpen: false,
    sortBy: 'rating',
  });

  useEffect(() => {
    console.log('🚀 RestaurantListScreen mounted');
    loadRestaurants();
  }, []);

  const loadRestaurants = async (showRefreshLoader = false) => {
    console.log('🔄 Caricamento ristoranti iniziato...');
    if (showRefreshLoader) setRefreshing(true);
    else setLoading(true);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('🔐 Permission status:', status);
      
      let lat: number, lng: number;
      
      if (status !== 'granted') {
        console.log('🏠 Usando posizione default (Centro Napoli)');
        lat = NAPLES.LAT;
        lng = NAPLES.LNG;
      } else {
        console.log('📱 Permesso concesso, ottenendo posizione...');
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = location.coords.latitude;
        lng = location.coords.longitude;
        console.log('📍 Posizione corrente:', { lat, lng });
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

  const handleApplyFilters = (newFilters: FilterOptions) => {
    console.log('✅ Applicando nuovi filtri:', newFilters);
    setFilters(newFilters);
    
    // Se la distanza è cambiata, ricarica i dati
    if (newFilters.maxDistance !== filters.maxDistance) {
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

  const renderRestaurant: ListRenderItem<RestaurantWithDistance> = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.restaurantCard}
        onPress={() => navigation.navigate('RestaurantDetail', { restaurant: item })}
      >
        <View style={styles.restaurantInfo}>
          <View style={styles.headerRow}>
            <Text style={styles.restaurantName}>{item.name}</Text>
            <View style={styles.headerActions}>
              {item.distance && (
                <Text style={styles.distance}>📍 {formatDistance(item.distance)}</Text>
              )}
              <FavoriteButton restaurant={item} size="sm" style={styles.favoriteButton} />
            </View>
          </View>
          
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

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          📍 {filteredRestaurants.length} ristoranti trovati
          {getActiveFiltersCount() > 0 && ` • ${getActiveFiltersCount()} filtri attivi`}
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
    console.log('🔍 Nessun risultato per i filtri correnti');
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {renderHeader()}
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsTitle}>🔍 Nessun risultato</Text>
            <Text style={styles.noResultsSubtitle}>
              Prova a modificare i filtri di ricerca
            </Text>
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
                };
                setFilters(resetFilters);
              }}
            >
              <Text style={styles.resetFiltersText}>🔄 Reset Filtri</Text>
            </TouchableOpacity>
          </View>
          
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    marginLeft: 8,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  distance: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
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
});
