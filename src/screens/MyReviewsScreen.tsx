import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ReviewsService, UserReview } from '../services/reviewsService';
import { RootStackParamList } from '../../App';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function MyReviewsScreen() {
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { theme } = useTheme();

  useFocusEffect(
    useCallback(() => {
      loadMyReviews();
    }, [])
  );

  const loadMyReviews = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) setRefreshing(true);
      else setLoading(true);

      const myReviews = await ReviewsService.getUserReviews(user?.id || '');
      setReviews(myReviews);
    } catch (error) {
      console.error('❌ Errore caricamento recensioni:', error);
      Alert.alert('Errore', 'Impossibile caricare le recensioni');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    Alert.alert(
      'Conferma Eliminazione',
      'Sei sicuro di voler eliminare questa recensione?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await ReviewsService.deleteReview(reviewId);
              if (success) {
                setReviews(prev => prev.filter(r => r.id !== reviewId));
                Alert.alert('✅', 'Recensione eliminata con successo');
              } else {
                Alert.alert('Errore', 'Impossibile eliminare la recensione');
              }
            } catch (error) {
              console.error('❌ Errore eliminazione recensione:', error);
              Alert.alert('Errore', 'Si è verificato un errore');
            }
          }
        }
      ]
    );
  };

  const handleEditReview = (review: UserReview) => {
    // Naviga alla schermata di modifica (da implementare o riutilizzare AddReviewScreen)
    Alert.alert('Info', 'Funzionalità di modifica in arrivo!');
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={styles.star}>
          {i <= rating ? '⭐' : '☆'}
        </Text>
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'Data non disponibile';
    }
  };

  const renderReviewCard = (review: UserReview) => (
    <View
      key={review.id}
      style={[
        styles.reviewCard,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.border,
          shadowColor: theme.shadowColor,
        }
      ]}
    >
      <View style={styles.reviewHeader}>
        <View style={styles.reviewHeaderLeft}>
          <Text style={[styles.restaurantName, { color: theme.text }]}>
            {review.restaurantName}
          </Text>
          <Text style={[styles.reviewDate, { color: theme.textSecondary }]}>
            {formatDate(review.createdAt)}
          </Text>
        </View>
        <View style={styles.reviewActions}>
          <TouchableOpacity
            onPress={() => handleEditReview(review)}
            style={styles.actionButton}
          >
            <Text style={styles.actionIcon}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteReview(review.id)}
            style={styles.actionButton}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderStars(review.rating)}

      {review.text && (
        <Text style={[styles.reviewText, { color: theme.text }]}>
          {review.text}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.viewRestaurantButton, 
          { 
            borderColor: theme.primary,
            backgroundColor: theme.isDark ? theme.primary + '15' : '#FFF8F8'
          }
        ]}
        onPress={() => {
          // Naviga al dettaglio del ristorante
          navigation.navigate('RestaurantDetail' as any, {
            placeId: review.placeId,
            restaurant: { name: review.restaurantName, place_id: review.placeId }
          });
        }}
      >
        <Text style={[styles.viewRestaurantText, { color: theme.primary }]}>
          Vedi Ristorante →
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        Nessuna recensione ancora
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Inizia a scrivere recensioni sui ristoranti che visiti!
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('Search' as any)}
      >
        <Text style={styles.emptyButtonText}>Cerca Ristoranti</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Caricando recensioni...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Le Mie Recensioni</Text>
        <View style={styles.headerRight} />
      </View>

      {reviews.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadMyReviews(true)}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statsBar}>
            <Text style={[styles.statsText, { color: theme.textSecondary }]}>
              Hai scritto <Text style={[styles.statsNumber, { color: theme.primary }]}>{reviews.length}</Text> recensione{reviews.length !== 1 ? 'i' : ''}
            </Text>
          </View>

          {reviews.map(renderReviewCard)}

          <View style={styles.footerPadding} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    paddingTop: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  backIcon: {
    fontSize: 30,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerRight: {
    width: 44,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 100,
  },
  statsBar: {
    backgroundColor: 'transparent',
    padding: 14,
    marginBottom: 18,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 15,
    fontWeight: '500',
  },
  statsNumber: {
    fontWeight: '800',
    fontSize: 18,
  },
  reviewCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  reviewHeaderLeft: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  reviewDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  actionIcon: {
    fontSize: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  star: {
    fontSize: 18,
    marginRight: 3,
  },
  reviewText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
    fontWeight: '400',
  },
  viewRestaurantButton: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  viewRestaurantText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 44,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
    fontWeight: '500',
    lineHeight: 22,
  },
  emptyButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footerPadding: {
    height: 24,
  },
});
