import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Restaurant } from '../services/googlePlaces';

interface MapPreviewCardProps {
  restaurant: Restaurant;
  onPress: () => void;
  onClose: () => void;
}

export default function MapPreviewCard({ restaurant, onPress, onClose }: MapPreviewCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.95} style={styles.previewCard} onPress={onPress}>
      <View style={styles.previewRow}>
        <View style={styles.previewImageWrap}>
          {restaurant.photoUrl ? (
            <Image source={{ uri: restaurant.photoUrl }} style={styles.previewImage} />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Text style={{ fontSize: 18 }}>🍽️</Text>
            </View>
          )}
        </View>
        <View style={styles.previewContent}>
          <Text style={styles.previewTitle} numberOfLines={1}>{restaurant.name}</Text>
          <Text style={styles.previewSubtitle} numberOfLines={1}>{restaurant.cuisine_type || 'Ristorante'}</Text>
          <Text style={styles.previewRating}>⭐ {restaurant.rating?.toFixed(1) || 'N/A'}/5 {restaurant.isOpen ? '• Aperto' : '• Chiuso'}</Text>
        </View>
        <TouchableOpacity style={styles.previewClose} onPress={onClose}>
          <Text style={styles.previewCloseText}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.previewFooter}>
        <Text style={styles.previewHint}>Tocca di nuovo il pin o questo riquadro per i dettagli</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    padding: 12,
  },
  previewRow: { flexDirection: 'row', alignItems: 'center' },
  previewImageWrap: { width: 72, height: 72, borderRadius: 8, overflow: 'hidden', marginRight: 12 },
  previewImage: { width: '100%', height: '100%' },
  previewPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF3F2' },
  previewContent: { flex: 1 },
  previewTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  previewSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  previewRating: { fontSize: 12, color: '#444', marginTop: 6, fontWeight: '600' },
  previewClose: { padding: 6, marginLeft: 6 },
  previewCloseText: { fontSize: 16, color: '#999' },
  previewFooter: { marginTop: 8 },
  previewHint: { fontSize: 11, color: '#999' },
});

