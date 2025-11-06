import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Region } from '../components/MapView';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { Restaurant, searchNearbyRestaurants } from '../services/googlePlaces';
import { useLocationSelection } from '../contexts/LocationContext';
import { useTheme } from '../contexts/ThemeContext';
import FilterModal, { FilterOptions } from '../components/FilterModal';
import RestaurantCard from '../components/RestaurantCard';
import {
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
  Animation,
} from '../styles/designSystem';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

export default function SearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { coordinates: selectedCoords } = useLocationSelection();

  const [mode, setMode] = useState<'list' | 'map'>('list');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [region, setRegion] = useState<Region | null>(null);
  const regionDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const searchBarAnim = useRef(new Animated.Value(0)).current;
  const filterButtonScale = useRef(new Animated.Value(1)).current;

  const [filters, setFilters] = useState<FilterOptions>({
    cuisineTypes: ['Tutti'],
    priceRange: [1, 4],
    minRating: 0,
    maxDistance: 5000,
    showOnlyOpen: false,
    sortBy: 'distance',
    locationQuery: '',
  });

  useEffect(() => {
    load();
  }, [selectedCoords?.latitude, selectedCoords?.longitude]);

  useEffect(() => {
    Animated.spring(searchBarAnim, {
      toValue: searchFocused ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [searchFocused]);

  const load = async () => {
    try {
      setRefreshing(true);
      const lat = selectedCoords?.latitude ?? 40.8522;
      const lng = selectedCoords?.longitude ?? 14.2681;
      const data = await searchNearbyRestaurants(lat, lng, 5000, 60);
      setRestaurants(data);
      setRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    } finally {
      setRefreshing(false);
    }
  };

  const onRegionChangeComplete = (r: Region) => {
    setRegion(r);
    if (regionDebounceRef.current) clearTimeout(regionDebounceRef.current);
    regionDebounceRef.current = setTimeout(async () => {
      const approxRadius = Math.min(50000, Math.max(1000, r.latitudeDelta * 111000 * 0.5));
      const data = await searchNearbyRestaurants(r.latitude, r.longitude, approxRadius);
      setRestaurants(data);
    }, 400);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filteredRestaurants = useMemo(() => {
    const centerLat = region?.latitude ?? selectedCoords?.latitude ?? 40.8522;
    const centerLng = region?.longitude ?? selectedCoords?.longitude ?? 14.2681;

    let withDistance = restaurants.map((r) => ({
      ...r,
      distance: calculateDistance(centerLat, centerLng, r.latitude, r.longitude),
    }));

    // Filtra per query di ricerca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      withDistance = withDistance.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.address.toLowerCase().includes(query) ||
          r.cuisine_type?.toLowerCase().includes(query)
      );
    }

    // Applica filtri avanzati
    let filtered = withDistance.filter((r) => {
      if (!filters.cuisineTypes.includes('Tutti')) {
        const match = filters.cuisineTypes.some((c) =>
          r.cuisine_type?.toLowerCase().includes(c.toLowerCase())
        );
        if (!match) return false;
      }
      if (r.priceLevel) {
        if (r.priceLevel < filters.priceRange[0] || r.priceLevel > filters.priceRange[1])
          return false;
      }
      if (r.rating < filters.minRating) return false;
      if (filters.showOnlyOpen && !r.isOpen) return false;
      if (r.distance && r.distance > filters.maxDistance) return false;
      return true;
    });

    // Ordinamento
    if (filters.sortBy === 'rating') filtered.sort((a, b) => b.rating - a.rating);
    else if (filters.sortBy === 'price')
      filtered.sort((a, b) => (a.priceLevel || 1) - (b.priceLevel || 1));
    else filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    return filtered;
  }, [restaurants, filters, region, selectedCoords, searchQuery]);

  const handleFilterPress = () => {
    Animated.sequence([
      Animated.timing(filterButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(filterButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    setShowFilters(true);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (!filters.cuisineTypes.includes('Tutti')) count++;
    if (filters.minRating > 0) count++;
    if (filters.priceRange[0] > 1 || filters.priceRange[1] < 4) count++;
    if (filters.showOnlyOpen) count++;
    if (filters.maxDistance < 5000) count++;
    return count;
  }, [filters]);

  const searchBarWidth = searchBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [width - 140, width - 32],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header con search bar e toggle */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        {/* Search Bar Animata */}
        <Animated.View
          style={[
            styles.searchBarContainer,
            {
              backgroundColor: theme.surface,
              borderColor: searchFocused ? theme.primary : theme.border,
              width: searchBarWidth,
            },
          ]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Cerca ristoranti, cucina..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Text style={{ color: theme.textSecondary, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Filter Button */}
        {!searchFocused && (
          <Animated.View style={{ transform: [{ scale: filterButtonScale }] }}>
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: theme.primary }]}
              onPress={handleFilterPress}
              activeOpacity={0.8}
            >
              <Text style={styles.filterIcon}>⚙️</Text>
              {activeFiltersCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Mode Toggle */}
      <View style={styles.toggleContainer}>
        <View
          style={[
            styles.toggleBackground,
            {
              backgroundColor: theme.surface,
              borderWidth: theme.isDark ? 1 : 0,
              borderColor: theme.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.toggleButton,
              mode === 'list' && [
                styles.toggleButtonActive,
                { backgroundColor: theme.primary },
              ],
            ]}
            onPress={() => setMode('list')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.toggleText,
                { color: theme.textSecondary },
                mode === 'list' && styles.toggleTextActive,
              ]}
            >
              📋 Lista
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              mode === 'map' && [
                styles.toggleButtonActive,
                { backgroundColor: theme.primary },
              ],
            ]}
            onPress={() => setMode('map')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.toggleText,
                { color: theme.textSecondary },
                mode === 'map' && styles.toggleTextActive,
              ]}
            >
              🗺️ Mappa
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results count */}
        <Text style={[styles.resultsCount, { color: theme.textSecondary }]}>
          {filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'risultato' : 'risultati'}
        </Text>
      </View>

      {/* Content */}
      {mode === 'list' ? (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              onPress={() => navigation.navigate('RestaurantDetail', { restaurant: item })}
              variant="default"
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: 110 }]}
          style={{ backgroundColor: theme.background }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={load}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Nessun risultato
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Prova a modificare i filtri o la ricerca
              </Text>
            </View>
          }
        />
      ) : (
        <View style={{ flex: 1 }}>
          <MapView
            style={StyleSheet.absoluteFillObject}
            region={region || undefined}
            onRegionChangeComplete={onRegionChangeComplete}
            showsUserLocation
            userInterfaceStyle={theme.isDark ? 'dark' : 'light'}
          >
            {filteredRestaurants.map((r) => (
              <Marker
                key={r.id}
                coordinate={{ latitude: r.latitude, longitude: r.longitude }}
                title={r.name}
                description={`⭐ ${r.rating}`}
                onPress={() => navigation.navigate('RestaurantDetail', { restaurant: r })}
              />
            ))}
          </MapView>

          {/* Map overlay info */}
          <View style={[styles.mapOverlay, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.mapOverlayText, { color: theme.text }]}>
              Trascina per esplorare
            </Text>
          </View>
        </View>
      )}

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApplyFilters={(f: FilterOptions) => setFilters(f)}
        currentFilters={filters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    height: 50,
    borderRadius: BorderRadius.xxl,
    borderWidth: 2,
    ...Shadows.base,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
    position: 'relative',
  },
  filterIcon: {
    fontSize: 22,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: Typography.fontWeight.bold,
  },
  toggleContainer: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  toggleBackground: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xs,
    ...Shadows.sm,
    marginBottom: Spacing.sm,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  toggleButtonActive: {},
  toggleText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  resultsCount: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.huge * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.black,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
  },
  mapOverlay: {
    position: 'absolute',
    top: Spacing.base,
    left: Spacing.base,
    right: Spacing.base,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  mapOverlayText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  },
});
