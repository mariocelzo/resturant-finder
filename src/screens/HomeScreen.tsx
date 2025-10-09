import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Modal, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { Restaurant, searchNearbyRestaurants } from '../services/googlePlaces';
import { useLocationSelection } from '../contexts/LocationContext';
import { geocodeLocation } from '../services/googlePlaces';
import { useTheme } from '../contexts/ThemeContext';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const NAPLES = { LAT: 40.8522, LNG: 14.2681 };

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { coordinates: selectedCoords, locationQuery, setManualLocation } = useLocationSelection();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    load(true);
  }, []);

  useEffect(() => {
    if (selectedCoords) {
      load();
    }
  }, [selectedCoords?.latitude, selectedCoords?.longitude]);

  const load = async (initial = false) => {
    try {
      if (initial) setLoading(true); else setRefreshing(true);
      let lat: number = selectedCoords?.latitude ?? NAPLES.LAT;
      let lng: number = selectedCoords?.longitude ?? NAPLES.LNG;

      if (!selectedCoords) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = loc.coords.latitude; lng = loc.coords.longitude;
        }
      }
      const data = await searchNearbyRestaurants(lat, lng, 4000, 60);
      setRestaurants(data);
    } catch (e) {
      console.error('❌ Home load error', e);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  const topByRating = useMemo(() => {
    return [...restaurants].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);
  }, [restaurants]);

  const cityFromQuery = (q?: string | null): string | null => {
    if (!q) return null;
    const first = q.split(',')[0]?.trim() || '';
    const cleaned = first.replace(/\b\d{4,6}\b/g, '').trim();
    return cleaned || first || null;
  };

  const cityLabel = cityFromQuery(locationQuery) || null;

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.shadowColor }]}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('RestaurantDetail', { restaurant: item })}
    >
      <View style={styles.cardRow}>
        <View style={styles.imageWrap}>
          {item.photoUrl ? (
            <Image source={{ uri: item.photoUrl }} style={styles.image} />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: theme.primary + '15' }]}>
              <Text style={{ opacity: 0.8, fontSize: 32 }}>🍽️</Text>
            </View>
          )}
          <View style={[styles.statusChip, {
            backgroundColor: item.isOpen
              ? (theme.isDark ? '#1B5E20' : '#E8F5E9')
              : (theme.isDark ? '#B71C1C' : '#FDECEA')
          }]}>
            <Text style={[styles.statusChipText, {
              color: item.isOpen
                ? (theme.isDark ? '#A5D6A7' : '#2E7D32')
                : (theme.isDark ? '#EF9A9A' : '#C62828')
            }]}>
              {item.isOpen ? 'Aperto' : 'Chiuso'}
            </Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.address, { color: theme.textSecondary }]} numberOfLines={2}>{item.address}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.metaChip, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[styles.metaText, { color: theme.primary }]}>⭐ {item.rating?.toFixed ? item.rating.toFixed(1) : item.rating}</Text>
            </View>
            <View style={[styles.metaChip, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[styles.metaText, { color: theme.primary }]}>{'€'.repeat(item.priceLevel || 1)}</Text>
            </View>
            {!!item.cuisine_type && (
              <View style={[styles.metaChip, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.metaText, { color: theme.primary }]}>{item.cuisine_type}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 12, color: theme.textSecondary, fontSize: 14 }}>
          Caricamento consigli vicino {locationQuery?.trim() || 'a te'}...
        </Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={topByRating}
        keyExtractor={(r) => r.id}
        renderItem={renderRestaurant}
        contentContainerStyle={[styles.list, { paddingBottom: 110 }]}
        style={{ backgroundColor: theme.background }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load()}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            {/* App header con pulsante ricerca */}
            <View style={styles.appHeader}>
              <Text style={[styles.brand, { color: theme.primary }]}>NearBite</Text>
              <TouchableOpacity
                style={[styles.searchButton, { backgroundColor: theme.primary + '15' }]}
                onPress={() => setSearchVisible(true)}
              >
                <Text style={[styles.searchIcon, { color: theme.primary }]}>🔍</Text>
              </TouchableOpacity>
            </View>

            {/* Hero section con gradiente */}
            <LinearGradient
              colors={theme.isDark
                ? [theme.primary + '40', theme.primary + '20']
                : [theme.primary + '25', theme.primary + '10']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.hero, { backgroundColor: theme.cardBackground }]}
            >
              <Text style={[styles.title, { color: theme.text }]}>
                🔥 Migliori ristoranti{cityLabel ? ` vicino ${cityLabel}` : ''}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                I locali con il rating più alto
              </Text>
            </LinearGradient>

            {/* Carousel consigliati */}
            {topByRating.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>⭐ Top del momento</Text>
                <FlatList
                  horizontal
                  data={topByRating.slice(0, 6)}
                  keyExtractor={(r) => `top_${r.id}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 8 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.topCard, {
                        backgroundColor: theme.cardBackground,
                        shadowColor: theme.shadowColor,
                        borderWidth: theme.isDark ? 1 : 0,
                        borderColor: theme.border,
                      }]}
                      onPress={() => navigation.navigate('RestaurantDetail', { restaurant: item })}
                      activeOpacity={0.9}
                    >
                      {item.photoUrl ? (
                        <Image source={{ uri: item.photoUrl }} style={styles.topImage} />
                      ) : (
                        <View style={[styles.topImage, {
                          backgroundColor: theme.primary + '15',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }]}>
                          <Text style={{ fontSize: 40 }}>🍽️</Text>
                        </View>
                      )}
                      <View style={styles.topMeta}>
                        <Text numberOfLines={1} style={[styles.topName, { color: theme.text }]}>{item.name}</Text>
                        <Text style={[styles.topRating, { color: theme.primary }]}>
                          ⭐ {item.rating?.toFixed ? item.rating.toFixed(1) : item.rating}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            {/* Categorie veloci */}
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>🍽️ Categorie popolari</Text>
              <View style={styles.chipsRow}>
                {['Pizzeria', 'Trattoria', 'Sushi', 'Burger', 'Dessert'].map((c) => (
                  <View key={c} style={[styles.chip, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={[styles.chipText, { color: theme.primary }]}>{c}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        }
        ListHeaderComponentStyle={{ paddingTop: 28 }}
      />
      <SearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onSubmit={async (q) => {
          const geo = await geocodeLocation(q);
          if (!geo) return;
          setManualLocation(q, { latitude: geo.latitude, longitude: geo.longitude, formattedAddress: geo.formattedAddress });
          const { useNavigation } = require('@react-navigation/native');
          const nav = useNavigation();
          nav.navigate('Search');
        }}
      />
    </>
  );
}

// Ricerca semplice: modal aperta dal pulsante header
function SearchModal({ visible, onClose, onSubmit }: { visible: boolean; onClose: () => void; onSubmit: (q: string) => void }) {
  const [q, setQ] = useState('');
  const { theme } = useTheme();

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={{ flex: 1, backgroundColor: theme.overlay, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          width: '86%',
          backgroundColor: theme.cardBackground,
          borderRadius: 20,
          padding: 20,
          ...Platform.select({
            ios: {
              shadowColor: theme.shadowColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
            },
            android: {
              elevation: 8,
            },
          }),
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '800',
            color: theme.text,
            marginBottom: 12
          }}>
            Scegli città o indirizzo
          </Text>
          <TextInput
            style={{
              borderWidth: 1.5,
              borderColor: theme.border,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              color: theme.text,
              backgroundColor: theme.surface,
            }}
            placeholder="Es. Napoli, Italia"
            placeholderTextColor={theme.textTertiary}
            value={q}
            onChangeText={setQ}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
            <TouchableOpacity
              style={{ paddingVertical: 12, paddingHorizontal: 16, marginRight: 8 }}
              onPress={onClose}
            >
              <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Annulla</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: theme.primary,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 12
              }}
              onPress={() => { const s = q.trim(); if (!s) return; onSubmit(s); onClose(); }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Cerca</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 24 },
  headerWrap: { paddingHorizontal: 4, paddingBottom: 8 },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  brand: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  searchButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchIcon: { fontSize: 18 },
  hero: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
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
  cardRow: { flexDirection: 'row' },
  imageWrap: {
    width: 96,
    height: 96,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 14,
    position: 'relative'
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusChip: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusChipText: { fontSize: 10, fontWeight: '700' },
  name: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  address: { fontSize: 13, marginTop: 3 },
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
  metaText: { fontWeight: '700', fontSize: 12 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5
  },
  topCard: {
    width: 170,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  topImage: {
    width: 170,
    height: 110,
  },
  topMeta: { padding: 12 },
  topName: { fontSize: 14, fontWeight: '700', letterSpacing: -0.3 },
  topRating: { fontSize: 13, marginTop: 4, fontWeight: '700' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 10,
    marginBottom: 10
  },
  chipText: { fontWeight: '700', fontSize: 13 },
});
