import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
  Dimensions
} from 'react-native';
import { Restaurant } from '../services/googlePlaces';
import { RouteProp, useRoute } from '@react-navigation/native';

type RootStackParamList = {
  RestaurantDetail: { restaurant: Restaurant };
};

type RestaurantDetailRouteProp = RouteProp<RootStackParamList, 'RestaurantDetail'>;

export default function RestaurantDetailScreen() {
  const route = useRoute<RestaurantDetailRouteProp>();
  const { restaurant } = route.params;

  const handleCall = () => {
    if (restaurant.phone) {
      Linking.openURL(`tel:${restaurant.phone}`);
    } else {
      Alert.alert('Info', 'Numero di telefono non disponibile');
    }
  };

  const handleDirections = () => {
    const url = `maps://?q=${restaurant.latitude},${restaurant.longitude}`;
    const fallbackUrl = `https://maps.google.com/?q=${restaurant.latitude},${restaurant.longitude}`;
    
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(fallbackUrl);
        }
      })
      .catch(() => Linking.openURL(fallbackUrl));
  };

  const handleShare = () => {
    const shareText = `Dai un'occhiata a ${restaurant.name}!\n${restaurant.address}\nRating: ${restaurant.rating}/5`;
    
    if (navigator.share) {
      navigator.share({
        title: restaurant.name,
        text: shareText,
      });
    } else {
      Alert.alert('Condividi', shareText);
    }
  };

  const getPriceLevelText = (level?: number) => {
    if (!level) return 'Prezzo non disponibile';
    return '€'.repeat(level) + ' '.repeat(4 - level);
  };

  const getCuisineIcon = (cuisine?: string) => {
    switch (cuisine?.toLowerCase()) {
      case 'pizzeria': return '🍕';
      case 'fine dining': return '🍴';
      case 'trattoria': return '🍝';
      case 'tradizionale': return '🇮🇹';
      default: return '🍽️';
    }
  };

  const mockReviews = [
    {
      id: '1',
      author: 'Marco R.',
      rating: 5,
      text: 'Pizza straordinaria, impasto perfetto e ingredienti di qualità. Consigliatissimo!',
      date: '2 settimane fa'
    },
    {
      id: '2',
      author: 'Anna M.',
      rating: 4,
      text: 'Locale storico con ottima atmosfera. La pizza è buonissima, unico neo i tempi di attesa.',
      date: '1 mese fa'
    },
    {
      id: '3',
      author: 'Giuseppe L.',
      rating: 5,
      text: 'Un\'istituzione napoletana! Da visitare assolutamente.',
      date: '2 mesi fa'
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header con immagine */}
      <View style={styles.headerContainer}>
        {restaurant.photoUrl ? (
          <Image source={{ uri: restaurant.photoUrl }} style={styles.heroImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderIcon}>
              {getCuisineIcon(restaurant.cuisine_type)}
            </Text>
          </View>
        )}
        
        {/* Overlay con status */}
        <View style={styles.statusOverlay}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: restaurant.isOpen ? '#4CAF50' : '#F44336' }
          ]}>
            <Text style={styles.statusText}>
              {restaurant.isOpen ? '🟢 Aperto' : '🔴 Chiuso'}
            </Text>
          </View>
        </View>
      </View>

      {/* Informazioni principali */}
      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>⭐ {restaurant.rating}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.cuisineText}>
            {getCuisineIcon(restaurant.cuisine_type)} {restaurant.cuisine_type}
          </Text>
          <Text style={styles.priceText}>
            {getPriceLevelText(restaurant.priceLevel)}
          </Text>
        </View>

        <Text style={styles.addressText}>📍 {restaurant.address}</Text>
      </View>

      {/* Pulsanti azione */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
          <Text style={styles.actionButtonIcon}>📞</Text>
          <Text style={styles.actionButtonText}>Chiama</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
          <Text style={styles.actionButtonIcon}>🗺️</Text>
          <Text style={styles.actionButtonText}>Indicazioni</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Text style={styles.actionButtonIcon}>📤</Text>
          <Text style={styles.actionButtonText}>Condividi</Text>
        </TouchableOpacity>
      </View>

      {/* Sezione recensioni */}
      <View style={styles.reviewsContainer}>
        <Text style={styles.sectionTitle}>📝 Recensioni</Text>
        
        {mockReviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewAuthor}>{review.author}</Text>
              <View style={styles.reviewRating}>
                <Text style={styles.reviewRatingText}>
                  {'⭐'.repeat(review.rating)}
                </Text>
              </View>
            </View>
            <Text style={styles.reviewText}>{review.text}</Text>
            <Text style={styles.reviewDate}>{review.date}</Text>
          </View>
        ))}
      </View>

      {/* Informazioni aggiuntive */}
      <View style={styles.additionalInfoContainer}>
        <Text style={styles.sectionTitle}>ℹ️ Informazioni</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Coordinate:</Text>
          <Text style={styles.infoValue}>
            {restaurant.latitude.toFixed(6)}, {restaurant.longitude.toFixed(6)}
          </Text>
        </View>

        {restaurant.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Telefono:</Text>
            <Text style={styles.infoValue}>{restaurant.phone}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>ID:</Text>
          <Text style={styles.infoValue}>{restaurant.id}</Text>
        </View>
      </View>

      {/* Padding bottom per sicurezza */}
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  headerContainer: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 80,
  },
  statusOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  ratingContainer: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF8F00',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cuisineText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  priceText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  addressText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 15,
    backgroundColor: '#f8f8f8',
    marginHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  actionButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewsContainer: {
    backgroundColor: 'white',
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewRating: {
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reviewRatingText: {
    fontSize: 14,
  },
  reviewText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  additionalInfoContainer: {
    backgroundColor: 'white',
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});