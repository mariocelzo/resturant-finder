import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Restaurant } from '../services/googlePlaces';
import { fetchPlaceReviews, PlaceReview } from '../services/googlePlaces';
import { ReviewsService, UserReview } from '../services/reviewsService';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

type RestaurantDetailRouteProp = RouteProp<RootStackParamList, 'RestaurantDetail'>;

export default function RestaurantDetailScreen() {
  const route = useRoute<RestaurantDetailRouteProp>();
  const { restaurant } = route.params;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();

  const [reviews, setReviews] = useState<PlaceReview[] | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [userReviews, setUserReviews] = useState<UserReview[] | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setReviewsLoading(true);
        setReviewsError(null);
        const data = await fetchPlaceReviews(restaurant.id, 8);
        if (mounted) setReviews(data);
        const u = await ReviewsService.listForPlace(restaurant.id);
        if (mounted) setUserReviews(u);
      } catch (e) {
        if (mounted) setReviewsError('Impossibile caricare le recensioni');
      } finally {
        if (mounted) setReviewsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [restaurant.id]);

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

  const handleAddReview = () => {
    navigation.navigate('AddReview', { placeId: restaurant.id, restaurantName: restaurant.name });
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
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      {/* Header con immagine */}
      <View style={styles.headerContainer}>
        {restaurant.photoUrl ? (
          <Image source={{ uri: restaurant.photoUrl }} style={styles.heroImage} />
        ) : (
          <LinearGradient
            colors={theme.isDark
              ? [theme.primary + '60', theme.primary + '40']
              : [theme.primary + '40', theme.primary + '20']
            }
            style={styles.placeholderImage}
          >
            <Text style={styles.placeholderIcon}>
              {getCuisineIcon(restaurant.cuisine_type)}
            </Text>
          </LinearGradient>
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
      <View style={[styles.infoContainer, {
        backgroundColor: theme.cardBackground,
        shadowColor: theme.shadowColor,
        borderWidth: theme.isDark ? 1 : 0,
        borderColor: theme.border,
      }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.restaurantName, { color: theme.text }]}>{restaurant.name}</Text>
          <View style={[styles.ratingContainer, { backgroundColor: theme.primary + '20' }]}>
            <Text style={[styles.ratingText, { color: theme.primary }]}>⭐ {restaurant.rating}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.cuisineText, { color: theme.textSecondary }]}>
            {getCuisineIcon(restaurant.cuisine_type)} {restaurant.cuisine_type}
          </Text>
          <Text style={[styles.priceText, { color: theme.success }]}>
            {getPriceLevelText(restaurant.priceLevel)}
          </Text>
        </View>

        <Text style={[styles.addressText, { color: theme.textSecondary }]}>📍 {restaurant.address}</Text>
      </View>

      {/* Pulsanti azione */}
      <View style={[styles.actionButtonsContainer, { backgroundColor: theme.cardBackground }]}>
        <TouchableOpacity style={[styles.actionButton, {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        }]} onPress={handleCall}>
          <Text style={styles.actionButtonIcon}>📞</Text>
          <Text style={[styles.actionButtonText, { color: theme.text }]}>Chiama</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        }]} onPress={handleDirections}>
          <Text style={styles.actionButtonIcon}>🗺️</Text>
          <Text style={[styles.actionButtonText, { color: theme.text }]}>Indicazioni</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        }]} onPress={handleShare}>
          <Text style={styles.actionButtonIcon}>📤</Text>
          <Text style={[styles.actionButtonText, { color: theme.text }]}>Condividi</Text>
        </TouchableOpacity>
      </View>

      {/* Sezione recensioni */}
      <View style={[styles.reviewsContainer, {
        backgroundColor: theme.cardBackground,
        borderWidth: theme.isDark ? 1 : 0,
        borderColor: theme.border,
      }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>📝 Recensioni</Text>
        <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 8 }} onPress={handleAddReview}>
          <Text style={{ color: theme.primary, fontWeight: '700' }}>+ Aggiungi recensione</Text>
        </TouchableOpacity>
        {reviewsLoading && (
          <Text style={{ color: theme.textSecondary }}>Caricamento recensioni...</Text>
        )}
        {!reviewsLoading && reviewsError && (
          <Text style={{ color: theme.error }}>{ reviewsError}</Text>
        )}
        {!reviewsLoading && !reviewsError && Array.isArray(reviews) && reviews.length === 0 && (
          <Text style={{ color: theme.textSecondary }}>Nessuna recensione disponibile</Text>
        )}
        {!reviewsLoading && !reviewsError && Array.isArray(reviews) && reviews.length > 0 && (
          <>
            {reviews.map((review) => (
              <View key={review.id} style={[styles.reviewCard, {
                backgroundColor: theme.surface,
                borderWidth: theme.isDark ? 1 : 0,
                borderColor: theme.border,
              }]}>
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewAuthor, { color: theme.text }]}>{review.authorName}</Text>
                  <View style={[styles.reviewRating, { backgroundColor: theme.primary + '15' }]}>
                    <Text style={styles.reviewRatingText}>
                      {'⭐'.repeat(Math.max(0, Math.min(5, Math.round(review.rating))))}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.reviewText, { color: theme.textSecondary }]}>{review.text}</Text>
                {review.relativeTime ? (
                  <Text style={[styles.reviewDate, { color: theme.textTertiary }]}>{review.relativeTime}</Text>
                ) : null}
              </View>
            ))}
          </>
        )}

        {/* Recensioni utenti app */}
        {Array.isArray(userReviews) && userReviews.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 12, color: theme.text }]}>👥 Recensioni Utenti</Text>
            {userReviews.map(ur => (
              <View key={ur.id} style={[styles.reviewCard, {
                backgroundColor: theme.surface,
                borderWidth: theme.isDark ? 1 : 0,
                borderColor: theme.border,
              }]}>
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewAuthor, { color: theme.text }]}>{ur.userDisplayName || 'Utente'}</Text>
                  <View style={[styles.reviewRating, { backgroundColor: theme.primary + '15' }]}>
                    <Text style={styles.reviewRatingText}>{'⭐'.repeat(Math.max(0, Math.min(5, Math.round(ur.rating))))}</Text>
                  </View>
                </View>
                <Text style={[styles.reviewText, { color: theme.textSecondary }]}>{ur.text}</Text>
                <Text style={[styles.reviewDate, { color: theme.textTertiary }]}>{new Date(ur.createdAt).toLocaleDateString('it-IT')}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Informazioni aggiuntive */}
      <View style={[styles.additionalInfoContainer, {
        backgroundColor: theme.cardBackground,
        borderWidth: theme.isDark ? 1 : 0,
        borderColor: theme.border,
      }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>ℹ️ Informazioni</Text>

        <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Coordinate:</Text>
          <Text style={[styles.infoValue, { color: theme.text }]}>
            {restaurant.latitude.toFixed(6)}, {restaurant.longitude.toFixed(6)}
          </Text>
        </View>

        {restaurant.phone && (
          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Telefono:</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{restaurant.phone}</Text>
          </View>
        )}

        <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>ID:</Text>
          <Text style={[styles.infoValue, { color: theme.text }]}>{restaurant.id}</Text>
        </View>
      </View>

      {/* Padding bottom per sicurezza */}
      <View style={{ height: 110 }} />
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