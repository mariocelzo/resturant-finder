import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, RefreshControl, SafeAreaView, Platform } from 'react-native';
import MapView, { Marker, Region } from '../components/MapView';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { Restaurant, searchNearbyRestaurants } from '../services/googlePlaces';
import { useLocationSelection } from '../contexts/LocationContext';
import { useTheme } from '../contexts/ThemeContext';
import FilterModal, { FilterOptions } from '../components/FilterModal';

type NavigationProp = StackNavigationProp<RootStackParamList>;

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

  const load = async () => {
    try {
      setRefreshing(true);
      const lat = selectedCoords?.latitude ?? 40.8522;
      const lng = selectedCoords?.longitude ?? 14.2681;
      const data = await searchNearbyRestaurants(lat, lng, 4000, 60);
      setRestaurants(data);
      setRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    } finally {
      setRefreshing(false);
    }
  };

  const renderItem = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={[styles.card, {
        backgroundColor: theme.cardBackground,
        shadowColor: theme.shadowColor,
        borderWidth: theme.isDark ? 1 : 0,
        borderColor: theme.border,
      }]}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('RestaurantDetail', { restaurant: item })}
    >
      <View style={styles.row}>
        <View style={[styles.imageWrap, { backgroundColor: theme.primary + '15' }]}>
          {item.photoUrl ? (
            <Image source={{ uri: item.photoUrl }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={{ fontSize: 32 }}>🍽️</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.addr, { color: theme.textSecondary }]} numberOfLines={2}>{item.address}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.metaChip, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[styles.metaText, { color: theme.primary }]}>⭐ {item.rating?.toFixed ? item.rating.toFixed(1) : item.rating}</Text>
            </View>
            <View style={[styles.metaChip, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[styles.metaText, { color: theme.primary }]}>{'€'.repeat(item.priceLevel || 1)}</Text>
            </View>
            {item.cuisine_type && (
              <View style={[styles.metaChip, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.metaText, { color: theme.primary }]}>{item.cuisine_type}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

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
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const filteredRestaurants = useMemo(() => {
    const centerLat = region?.latitude ?? selectedCoords?.latitude ?? 40.8522;
    const centerLng = region?.longitude ?? selectedCoords?.longitude ?? 14.2681;
    let withDistance = restaurants.map(r => ({
      ...r,
      distance: calculateDistance(centerLat, centerLng, r.latitude, r.longitude)
    }));

    let filtered = withDistance.filter(r => {
      if (!filters.cuisineTypes.includes('Tutti')) {
        const match = filters.cuisineTypes.some(c => r.cuisine_type?.toLowerCase().includes(c.toLowerCase()));
        if (!match) return false;
      }
      if (r.priceLevel) {
        if (r.priceLevel < filters.priceRange[0] || r.priceLevel > filters.priceRange[1]) return false;
      }
      if (r.rating < filters.minRating) return false;
      if (filters.showOnlyOpen && !r.isOpen) return false;
      if (r.distance && r.distance > filters.maxDistance) return false;
      return true;
    });

    if (filters.sortBy === 'rating') filtered.sort((a, b) => b.rating - a.rating);
    else if (filters.sortBy === 'price') filtered.sort((a, b) => (a.priceLevel || 1) - (b.priceLevel || 1));
    else filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    return filtered;
  }, [restaurants, filters, region, selectedCoords]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Toggle */}
      <View style={[styles.toggleWrap, { backgroundColor: theme.background }]}>
        <View style={[styles.toggleBg, {
          backgroundColor: theme.surface,
          shadowColor: theme.shadowColor,
          borderWidth: theme.isDark ? 1 : 0,
          borderColor: theme.border,
        }]}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'list' && [styles.toggleBtnActive, { backgroundColor: theme.primary }]]}
            onPress={() => setMode('list')}
          >
            <Text style={[styles.toggleText, { color: theme.textSecondary }, mode === 'list' && styles.toggleTextActive]}>Lista</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'map' && [styles.toggleBtnActive, { backgroundColor: theme.primary }]]}
            onPress={() => setMode('map')}
          >
            <Text style={[styles.toggleText, { color: theme.textSecondary }, mode === 'map' && styles.toggleTextActive]}>Mappa</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: theme.primary }]}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterBtnText}>Filtri</Text>
        </TouchableOpacity>
      </View>

      {mode === 'list' ? (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(r) => r.id}
          renderItem={renderItem}
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
        />
      ) : (
        <MapView
          style={{ flex: 1 }}
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
  container: { flex: 1 },
  toggleWrap: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  toggleBg: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
    flex: 1
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20
  },
  toggleBtnActive: {},
  toggleText: {
    fontWeight: '700',
    fontSize: 14
  },
  toggleTextActive: {
    color: '#fff'
  },
  filterBtn: {
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20
  },
  filterBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8
  },
  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  row: { flexDirection: 'row' },
  imageWrap: {
    width: 96,
    height: 96,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 14
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3
  },
  addr: {
    fontSize: 13,
    marginTop: 3
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10
  },
  metaChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 6
  },
  metaText: {
    fontWeight: '700',
    fontSize: 12
  },
});
