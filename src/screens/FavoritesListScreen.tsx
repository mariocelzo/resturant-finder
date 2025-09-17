import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import FavoriteButton from '../components/FavoriteButton';
import { FavoriteRestaurant } from '../services/favoriteService';
import { useFavorites } from '../hooks/useFavorites';

export default function FavoritesListScreen() {
  const navigation = useNavigation<any>();
  const { favorites, loading, refreshFavorites } = useFavorites();
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showRefresh = false) => {
    showRefresh ? setRefreshing(true) : null;
    await refreshFavorites();
    showRefresh ? setRefreshing(false) : null;
  };

  useEffect(() => {
    load();
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const renderItem = ({ item }: { item: FavoriteRestaurant }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('RestaurantDetail', { restaurant: item })}
      activeOpacity={0.85}
    >
      <View style={styles.row}>
        <View style={styles.imageContainer}>
          {item.photoUrl ? (
            <Image source={{ uri: item.photoUrl }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Image source={require('../../assets/NearBiteLogo.png')} style={styles.imageLogo} />
            </View>
          )}
          <FavoriteButton restaurant={item} size="sm" style={styles.favoriteOverlay} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.address} numberOfLines={2}>{item.address}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}><Text style={styles.metaChipText}>⭐ {Number(item.rating).toFixed(1)}</Text></View>
            {!!item.priceLevel && (
              <View style={styles.metaChip}><Text style={styles.metaChipText}>{'€'.repeat(item.priceLevel)}</Text></View>
            )}
            {!!item.cuisine_type && (
              <View style={styles.metaChip}><Text style={styles.metaChipText}>{item.cuisine_type}</Text></View>
            )}
          </View>
          {!!item.favorited_at && (
            <Text style={styles.favDate}>Salvato: {new Date(item.favorited_at).toLocaleDateString()}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Caricando preferiti...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!favorites.length) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Nessun preferito</Text>
          <Text style={styles.emptySubtitle}>Aggiungi ristoranti ai preferiti dalla lista o dalla mappa.</Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Lista')}>
            <Text style={styles.exploreText}>Esplora ristoranti</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#FF6B6B" colors={['#FF6B6B']} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { padding: 16, paddingBottom: 24 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16 },
  exploreBtn: { backgroundColor: '#FF6B6B', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  exploreText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  row: { flexDirection: 'row' },
  imageContainer: { width: 96, height: 96, borderRadius: 12, overflow: 'hidden', marginRight: 12, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, backgroundColor: '#FFF3F2', alignItems: 'center', justifyContent: 'center' },
  imageLogo: { width: 48, height: 48, resizeMode: 'contain', opacity: 0.8 },
  favoriteOverlay: { position: 'absolute', top: 6, right: 6 },
  info: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  address: { fontSize: 14, color: '#666', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaChip: { backgroundColor: '#FFF0ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 6 },
  metaChipText: { color: '#FF6B6B', fontWeight: '600', fontSize: 12 },
  favDate: { marginTop: 6, fontSize: 11, color: '#999' },
});
