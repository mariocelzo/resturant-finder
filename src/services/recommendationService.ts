import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Tipi di interazioni che l'utente può avere con un ristorante
 */
export enum InteractionType {
  VIEW = 'view',           // Visualizzazione dettaglio (peso: 1)
  FAVORITE = 'favorite',   // Aggiunta ai preferiti (peso: 5)
  UNFAVORITE = 'unfavorite', // Rimozione dai preferiti (peso: -3)
  REVIEW = 'review',       // Recensione scritta (peso: 10)
  SEARCH = 'search',       // Ricerca per tipo cucina (peso: 0.5)
}

export interface UserInteraction {
  id?: string;
  user_id: string;
  place_id: string;
  restaurant_name: string;
  cuisine_type?: string;
  price_level?: number;
  interaction_type: InteractionType;
  rating?: number; // Per le recensioni
  created_at?: string;
}

export interface CuisinePreference {
  cuisine_type: string;
  score: number;
  interaction_count: number;
  last_interaction: string;
}

export interface RecommendationWeights {
  view: number;
  favorite: number;
  unfavorite: number;
  review: number;
  search: number;
}

const DEFAULT_WEIGHTS: RecommendationWeights = {
  view: 1,
  favorite: 5,
  unfavorite: -3,
  review: 10,
  search: 0.5,
};

/**
 * Servizio per il tracking delle interazioni e le raccomandazioni personalizzate
 */
export class RecommendationService {
  private static GUEST_INTERACTIONS_KEY = 'guest_interactions_';

  /**
   * Traccia un'interazione dell'utente con un ristorante
   */
  static async trackInteraction(
    userId: string,
    placeId: string,
    restaurantName: string,
    interactionType: InteractionType,
    metadata?: {
      cuisineType?: string;
      priceLevel?: number;
      rating?: number;
      isGuest?: boolean;
    }
  ): Promise<boolean> {
    try {
      const interaction: UserInteraction = {
        user_id: userId,
        place_id: placeId,
        restaurant_name: restaurantName,
        cuisine_type: metadata?.cuisineType,
        price_level: metadata?.priceLevel,
        interaction_type: interactionType,
        rating: metadata?.rating,
        created_at: new Date().toISOString(),
      };

      // Per utenti guest, salviamo in AsyncStorage
      if (metadata?.isGuest) {
        await this.saveGuestInteraction(userId, interaction);
        return true;
      }

      // Per utenti autenticati, salviamo in Supabase
      const { error } = await supabase
        .from('user_interactions')
        .insert([interaction]);

      if (error) {
        console.error('Error tracking interaction:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in trackInteraction:', error);
      return false;
    }
  }

  /**
   * Salva interazione per utenti guest in AsyncStorage
   */
  private static async saveGuestInteraction(
    guestId: string,
    interaction: UserInteraction
  ): Promise<void> {
    try {
      const key = this.GUEST_INTERACTIONS_KEY + guestId;
      const existing = await AsyncStorage.getItem(key);
      const interactions: UserInteraction[] = existing ? JSON.parse(existing) : [];

      // Mantieni solo le ultime 100 interazioni per guest
      interactions.push(interaction);
      if (interactions.length > 100) {
        interactions.shift();
      }

      await AsyncStorage.setItem(key, JSON.stringify(interactions));
    } catch (error) {
      console.error('Error saving guest interaction:', error);
    }
  }

  /**
   * Ottiene le preferenze di cucina dell'utente basate sulle interazioni
   */
  static async getCuisinePreferences(
    userId: string,
    isGuest: boolean = false
  ): Promise<CuisinePreference[]> {
    try {
      let interactions: UserInteraction[] = [];

      if (isGuest) {
        // Carica da AsyncStorage per guest
        const key = this.GUEST_INTERACTIONS_KEY + userId;
        const data = await AsyncStorage.getItem(key);
        interactions = data ? JSON.parse(data) : [];
      } else {
        // Carica da Supabase per utenti autenticati
        const { data, error } = await supabase
          .from('user_interactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(200); // Ultimi 200 interazioni

        if (error) throw error;
        interactions = data || [];
      }

      // Calcola i punteggi per tipo di cucina
      const cuisineScores = new Map<string, {
        score: number;
        count: number;
        lastInteraction: string;
      }>();

      for (const interaction of interactions) {
        if (!interaction.cuisine_type) continue;

        const cuisine = interaction.cuisine_type;
        const weight = this.getInteractionWeight(interaction.interaction_type, interaction.rating);

        const current = cuisineScores.get(cuisine) || {
          score: 0,
          count: 0,
          lastInteraction: interaction.created_at || '',
        };

        current.score += weight;
        current.count += 1;

        // Aggiorna last_interaction se più recente
        if (!current.lastInteraction ||
            (interaction.created_at && interaction.created_at > current.lastInteraction)) {
          current.lastInteraction = interaction.created_at || '';
        }

        cuisineScores.set(cuisine, current);
      }

      // Converti in array e ordina per punteggio
      const preferences: CuisinePreference[] = Array.from(cuisineScores.entries())
        .map(([cuisine, data]) => ({
          cuisine_type: cuisine,
          score: data.score,
          interaction_count: data.count,
          last_interaction: data.lastInteraction,
        }))
        .sort((a, b) => b.score - a.score);

      return preferences;
    } catch (error) {
      console.error('Error getting cuisine preferences:', error);
      return [];
    }
  }

  /**
   * Calcola il peso di un'interazione
   */
  private static getInteractionWeight(type: InteractionType, rating?: number): number {
    let baseWeight = DEFAULT_WEIGHTS[type] || 0;

    // Bonus/malus basato sul rating per le recensioni
    if (type === InteractionType.REVIEW && rating) {
      if (rating >= 4) {
        baseWeight += 2; // Bonus per recensioni positive
      } else if (rating <= 2) {
        baseWeight -= 2; // Malus per recensioni negative
      }
    }

    return baseWeight;
  }

  /**
   * Calcola un punteggio di raccomandazione per un ristorante
   * basato sulle preferenze dell'utente
   */
  static async getRecommendationScore(
    userId: string,
    restaurant: {
      cuisine_type?: string;
      price_level?: number;
      rating?: number;
    },
    isGuest: boolean = false
  ): Promise<number> {
    try {
      const preferences = await this.getCuisinePreferences(userId, isGuest);

      if (preferences.length === 0) {
        // Nessuna preferenza, usa solo il rating del ristorante
        return restaurant.rating || 0;
      }

      let score = 0;

      // Punteggio basato sulla cucina preferita
      if (restaurant.cuisine_type) {
        const cuisinePref = preferences.find(
          p => p.cuisine_type.toLowerCase() === restaurant.cuisine_type?.toLowerCase()
        );

        if (cuisinePref) {
          // Normalizza il punteggio della cucina (max 10 punti)
          const maxScore = Math.max(...preferences.map(p => p.score));
          const normalizedScore = (cuisinePref.score / maxScore) * 10;
          score += normalizedScore;

          // Bonus se è una delle top 3 preferenze
          const topThree = preferences.slice(0, 3);
          if (topThree.some(p => p.cuisine_type === restaurant.cuisine_type)) {
            score += 3;
          }
        }
      }

      // Bonus per ristoranti con rating alto (max 5 punti)
      if (restaurant.rating) {
        score += restaurant.rating;
      }

      // Leggero bonus/malus basato sul prezzo se abbiamo preferenze
      if (restaurant.price_level) {
        const avgPrice = await this.getAveragePricePreference(userId, isGuest);
        if (avgPrice) {
          const priceDiff = Math.abs(restaurant.price_level - avgPrice);
          score -= priceDiff * 0.5; // Piccolo malus se il prezzo si discosta dalla preferenza
        }
      }

      return Math.max(0, score); // Non può essere negativo
    } catch (error) {
      console.error('Error calculating recommendation score:', error);
      return restaurant.rating || 0;
    }
  }

  /**
   * Ottiene il livello di prezzo medio preferito dall'utente
   */
  private static async getAveragePricePreference(
    userId: string,
    isGuest: boolean
  ): Promise<number | null> {
    try {
      let interactions: UserInteraction[] = [];

      if (isGuest) {
        const key = this.GUEST_INTERACTIONS_KEY + userId;
        const data = await AsyncStorage.getItem(key);
        interactions = data ? JSON.parse(data) : [];
      } else {
        const { data, error } = await supabase
          .from('user_interactions')
          .select('*')
          .eq('user_id', userId)
          .not('price_level', 'is', null)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        interactions = data || [];
      }

      const prices = interactions
        .filter(i => i.price_level)
        .map(i => i.price_level!);

      if (prices.length === 0) return null;

      const sum = prices.reduce((a, b) => a + b, 0);
      return sum / prices.length;
    } catch (error) {
      console.error('Error getting average price preference:', error);
      return null;
    }
  }

  /**
   * Ordina una lista di ristoranti in base alle raccomandazioni personalizzate
   */
  static async sortByRecommendation<T extends {
    id: string;
    cuisine_type?: string;
    priceLevel?: number;
    rating?: number;
  }>(
    userId: string,
    restaurants: T[],
    isGuest: boolean = false,
    mixFactor: number = 0.7 // 0-1, quanto pesano le preferenze vs esplorazione
  ): Promise<T[]> {
    try {
      // Calcola i punteggi per ogni ristorante
      const restaurantsWithScores = await Promise.all(
        restaurants.map(async (restaurant) => {
          const recommendationScore = await this.getRecommendationScore(
            userId,
            {
              cuisine_type: restaurant.cuisine_type,
              price_level: restaurant.priceLevel,
              rating: restaurant.rating,
            },
            isGuest
          );

          // Mix tra raccomandazione personalizzata e qualità generale
          // Questo permette di mostrare anche ristoranti nuovi/diversi
          const baseScore = restaurant.rating || 0;
          const finalScore = (recommendationScore * mixFactor) + (baseScore * (1 - mixFactor));

          // Aggiungi un po' di casualità per varietà (max ±5%)
          const randomFactor = 1 + (Math.random() - 0.5) * 0.1;

          return {
            restaurant,
            score: finalScore * randomFactor,
          };
        })
      );

      // Ordina per punteggio decrescente
      restaurantsWithScores.sort((a, b) => b.score - a.score);

      return restaurantsWithScores.map(item => item.restaurant);
    } catch (error) {
      console.error('Error sorting by recommendation:', error);
      return restaurants; // Ritorna l'ordine originale in caso di errore
    }
  }

  /**
   * Ottiene statistiche sulle preferenze dell'utente
   */
  static async getUserPreferenceStats(
    userId: string,
    isGuest: boolean = false
  ): Promise<{
    totalInteractions: number;
    topCuisines: CuisinePreference[];
    averagePrice: number | null;
    favoriteCount: number;
    reviewCount: number;
  }> {
    try {
      let interactions: UserInteraction[] = [];

      if (isGuest) {
        const key = this.GUEST_INTERACTIONS_KEY + userId;
        const data = await AsyncStorage.getItem(key);
        interactions = data ? JSON.parse(data) : [];
      } else {
        const { data, error } = await supabase
          .from('user_interactions')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;
        interactions = data || [];
      }

      const cuisinePreferences = await this.getCuisinePreferences(userId, isGuest);
      const avgPrice = await this.getAveragePricePreference(userId, isGuest);

      return {
        totalInteractions: interactions.length,
        topCuisines: cuisinePreferences.slice(0, 5),
        averagePrice: avgPrice,
        favoriteCount: interactions.filter(i => i.interaction_type === InteractionType.FAVORITE).length,
        reviewCount: interactions.filter(i => i.interaction_type === InteractionType.REVIEW).length,
      };
    } catch (error) {
      console.error('Error getting user preference stats:', error);
      return {
        totalInteractions: 0,
        topCuisines: [],
        averagePrice: null,
        favoriteCount: 0,
        reviewCount: 0,
      };
    }
  }
}
