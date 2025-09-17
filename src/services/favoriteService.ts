import { supabase } from './supabase';
import { Restaurant } from './googlePlaces';
import { AuthService } from './authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FavoriteRestaurant extends Restaurant {
  favorited_at?: string;
}

export class FavoritesService {
  
  /**
   * Aggiunge un ristorante ai preferiti
   */
  static async addToFavorites(restaurant: Restaurant): Promise<boolean> {
    try {
      console.log('❤️ Adding to favorites:', restaurant);

      const user = await AuthService.getCurrentUser();
      if (!user) {
        console.error('❌ User not authenticated');
        return false;
      }

      // Se è un guest user, salva in AsyncStorage
      if (user.isGuest) {
        return await this.addToGuestFavorites(restaurant);
      }

      const { data, error } = await supabase
        .from('favorites')
        .insert([
          {
            user_id: user.id,
            restaurant_id: restaurant.id,
            restaurant_name: restaurant.name,
            restaurant_address: restaurant.address,
            restaurant_latitude: restaurant.latitude,
            restaurant_longitude: restaurant.longitude,
            restaurant_rating: restaurant.rating,
            restaurant_price_level: restaurant.priceLevel,
            restaurant_photo_url: restaurant.photoUrl,
            restaurant_cuisine_type: restaurant.cuisine_type,
            restaurant_phone: restaurant.phone,
            restaurant_is_open: restaurant.isOpen,
          }
        ]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log('⚠️ Ristorante già nei preferiti');
          return true; // Considera come successo
        }
        console.error('❌ Errore aggiunta preferito:', error);
        return false;
      }

      console.log('✅ Ristorante aggiunto ai preferiti');
      return true;
    } catch (error) {
      console.error('❌ Errore nel servizio preferiti:', error);
      return false;
    }
  }

  /**
   * Rimuove un ristorante dai preferiti
   */
  static async removeFromFavorites(restaurantId: string): Promise<boolean> {
    try {
      console.log('💔 Rimuovendo dai preferiti:', restaurantId);
      
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        console.error('❌ Utente non autenticato');
        return false;
      }

      // Se è un guest user, usa AsyncStorage
      if (currentUser.isGuest) {
        return await this.removeFromGuestFavorites(restaurantId);
      }

      // Altrimenti usa Supabase
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('restaurant_id', restaurantId);

      if (error) {
        console.error('❌ Errore rimozione preferito:', error);
        return false;
      }

      console.log('✅ Ristorante rimosso dai preferiti');
      return true;
    } catch (error) {
      console.error('❌ Errore nel servizio preferiti:', error);
      return false;
    }
  }

  /**
   * Controlla se un ristorante è nei preferiti
   */
  static async isFavorite(restaurantId: string): Promise<boolean> {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        return false;
      }

      // Se è un guest user, controlla AsyncStorage
      if (currentUser.isGuest) {
        return await this.isGuestFavorite(currentUser.id, restaurantId);
      }

      // Altrimenti controlla Supabase
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('restaurant_id', restaurantId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Errore controllo preferito:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('❌ Errore nel controllo preferiti:', error);
      return false;
    }
  }

  /**
   * Ottiene tutti i ristoranti preferiti dell'utente
   */
  static async getFavorites(): Promise<FavoriteRestaurant[]> {
    try {
      console.log('📋 Caricando preferiti utente...');
      
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        console.log('⚠️ Utente non autenticato, returning empty array');
        return [];
      }

      // Se è un guest user, usa AsyncStorage
      if (currentUser.isGuest) {
        const guestFavorites = await this.getGuestFavorites(currentUser.id);
        console.log('✅ Preferiti guest caricati:', guestFavorites.length);
        return guestFavorites;
      }

      // Altrimenti usa Supabase
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Errore caricamento preferiti:', error);
        return [];
      }

      // Converte i dati del database nel formato Restaurant
      const favorites: FavoriteRestaurant[] = (data || []).map(fav => ({
        id: fav.restaurant_id,
        name: fav.restaurant_name,
        address: fav.restaurant_address || '',
        latitude: parseFloat(fav.restaurant_latitude || '0'),
        longitude: parseFloat(fav.restaurant_longitude || '0'),
        rating: parseFloat(fav.restaurant_rating || '0'),
        priceLevel: fav.restaurant_price_level,
        photoUrl: fav.restaurant_photo_url,
        cuisine_type: fav.restaurant_cuisine_type,
        phone: fav.restaurant_phone,
        isOpen: fav.restaurant_is_open,
        favorited_at: fav.created_at,
      }));

      console.log('✅ Preferiti caricati:', favorites.length);
      return favorites;
    } catch (error) {
      console.error('❌ Errore nel servizio preferiti:', error);
      return [];
    }
  }

  /**
   * Toggle preferito (aggiunge se non c'è, rimuove se c'è)
   */
  static async toggleFavorite(restaurant: Restaurant): Promise<boolean> {
    try {
      const isFav = await this.isFavorite(restaurant.id);
      
      if (isFav) {
        return await this.removeFromFavorites(restaurant.id);
      } else {
        return await this.addToFavorites(restaurant);
      }
    } catch (error) {
      console.error('❌ Errore toggle preferito:', error);
      return false;
    }
  }

  /**
   * Ottiene il conteggio dei preferiti
   */
  static async getFavoritesCount(): Promise<number> {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) return 0;

      // Se è un guest user, conta AsyncStorage
      if (currentUser.isGuest) {
        const guestFavorites = await this.getGuestFavorites(currentUser.id);
        return guestFavorites.length;
      }

      // Altrimenti conta Supabase
      const { count, error } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('❌ Errore conteggio preferiti:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ Errore nel conteggio preferiti:', error);
      return 0;
    }
  }

  /**
   * Ottiene gli IDs dei ristoranti preferiti (per performance)
   */
  static async getFavoriteIds(): Promise<string[]> {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) return [];

      // Se è un guest user, estrae IDs da AsyncStorage
      if (currentUser.isGuest) {
        const guestFavorites = await this.getGuestFavorites(currentUser.id);
        return guestFavorites.map(f => f.id);
      }

      // Altrimenti usa Supabase
      const { data, error } = await supabase
        .from('favorites')
        .select('restaurant_id')
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('❌ Errore caricamento IDs preferiti:', error);
        return [];
      }

      return (data || []).map(fav => fav.restaurant_id);
    } catch (error) {
      console.error('❌ Errore nel servizio preferiti:', error);
      return [];
    }
  }

  /**
   * Pulisce tutti i preferiti dell'utente (per sviluppo/debug)
   */
  static async clearAllFavorites(): Promise<boolean> {
    try {
      console.log('🗑️ Pulendo tutti i preferiti...');
      
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        console.error('❌ Utente non autenticato');
        return false;
      }

      // Se è un guest user, pulisci AsyncStorage
      if (currentUser.isGuest) {
        await AsyncStorage.removeItem(`guest_favorites_${currentUser.id}`);
        console.log('✅ Preferiti guest rimossi');
        return true;
      }

      // Altrimenti pulisci Supabase
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('❌ Errore pulizia preferiti:', error);
        return false;
      }

      console.log('✅ Tutti i preferiti sono stati rimossi');
      return true;
    } catch (error) {
      console.error('❌ Errore nella pulizia preferiti:', error);
      return false;
    }
  }

  // Metodi helper per guest users
  private static async addToGuestFavorites(restaurant: Restaurant): Promise<boolean> {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser?.isGuest) return false;

      const key = `guest_favorites_${currentUser.id}`;
      const existingFavorites = await this.getGuestFavorites(currentUser.id);
      
      // Controlla se già esiste
      if (existingFavorites.find(f => f.id === restaurant.id)) {
        console.log('⚠️ Ristorante già nei preferiti guest');
        return true;
      }
      
      const favorite: FavoriteRestaurant = {
        ...restaurant,
        favorited_at: new Date().toISOString(),
      };
      
      const updatedFavorites = [...existingFavorites, favorite];
      await AsyncStorage.setItem(key, JSON.stringify(updatedFavorites));
      
      console.log('✅ Ristorante aggiunto ai preferiti guest');
      return true;
    } catch (error) {
      console.error('❌ Errore aggiunta preferito guest:', error);
      return false;
    }
  }

  private static async removeFromGuestFavorites(restaurantId: string): Promise<boolean> {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser?.isGuest) return false;

      const key = `guest_favorites_${currentUser.id}`;
      const existingFavorites = await this.getGuestFavorites(currentUser.id);
      
      const updatedFavorites = existingFavorites.filter(f => f.id !== restaurantId);
      await AsyncStorage.setItem(key, JSON.stringify(updatedFavorites));
      
      console.log('✅ Ristorante rimosso dai preferiti guest');
      return true;
    } catch (error) {
      console.error('❌ Errore rimozione preferito guest:', error);
      return false;
    }
  }

  private static async getGuestFavorites(guestId: string): Promise<FavoriteRestaurant[]> {
    try {
      const key = `guest_favorites_${guestId}`;
      const favoritesJson = await AsyncStorage.getItem(key);
      
      if (favoritesJson) {
        return JSON.parse(favoritesJson) as FavoriteRestaurant[];
      }
      
      return [];
    } catch (error) {
      console.error('❌ Errore caricamento preferiti guest:', error);
      return [];
    }
  }

  private static async isGuestFavorite(guestId: string, restaurantId: string): Promise<boolean> {
    try {
      const favorites = await this.getGuestFavorites(guestId);
      return favorites.some(f => f.id === restaurantId);
    } catch (error) {
      console.error('❌ Errore controllo preferito guest:', error);
      return false;
    }
  }
}
