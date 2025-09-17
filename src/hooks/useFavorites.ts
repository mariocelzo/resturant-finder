import { useState, useEffect, useCallback } from 'react';
import { FavoritesService, FavoriteRestaurant } from '../services/favoriteService';
import { Restaurant } from '../services/googlePlaces';
import { useAuth } from '../contexts/AuthContext';

interface UseFavoritesReturn {
  favorites: FavoriteRestaurant[];
  favoriteIds: string[];
  loading: boolean;
  favoritesCount: number;
  
  // Actions
  addToFavorites: (restaurant: Restaurant) => Promise<boolean>;
  removeFromFavorites: (restaurantId: string) => Promise<boolean>;
  toggleFavorite: (restaurant: Restaurant) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
  clearAllFavorites: () => Promise<boolean>;
  
  // Utilities
  isFavorite: (restaurantId: string) => boolean;
  getFavoriteById: (restaurantId: string) => FavoriteRestaurant | undefined;
}

/**
 * Hook personalizzato per gestire i preferiti
 * Fornisce un'interfaccia semplice e reattiva per tutte le operazioni sui preferiti
 */
export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  // Carica i preferiti quando l'utente cambia
  useEffect(() => {
    if (isAuthenticated) {
      console.log('👤 Auth changed, loading favorites for user:', user?.email || user?.id);
      refreshFavorites();
    } else {
      console.log('🔓 User logged out, clearing favorites');
      setFavorites([]);
      setFavoriteIds([]);
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  const refreshFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([]);
      setFavoriteIds([]);
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Refreshing favorites...');
      setLoading(true);
      
      const [userFavorites, userFavoriteIds] = await Promise.all([
        FavoritesService.getFavorites(),
        FavoritesService.getFavoriteIds()
      ]);
      
      setFavorites(userFavorites);
      setFavoriteIds(userFavoriteIds);
      
      console.log('✅ Favorites refreshed:', {
        count: userFavorites.length,
        ids: userFavoriteIds.slice(0, 3) // Log solo i primi 3 per debug
      });
    } catch (error) {
      console.error('❌ Error refreshing favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const addToFavorites = useCallback(async (restaurant: Restaurant): Promise<boolean> => {
    if (!isAuthenticated) {
      console.log('⚠️ User not authenticated, cannot add favorite');
      return false;
    }

    try {
      console.log('❤️ Adding to favorites:', restaurant.name);
      const success = await FavoritesService.addToFavorites(restaurant);
      
      if (success) {
        // Aggiorna lo stato locale immediatamente per UX più fluida
        const newFavorite: FavoriteRestaurant = {
          ...restaurant,
          favorited_at: new Date().toISOString(),
        };
        
        setFavorites(prev => [newFavorite, ...prev]);
        setFavoriteIds(prev => [...prev, restaurant.id]);
        
        console.log('✅ Favorite added successfully');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error adding favorite:', error);
      return false;
    }
  }, [isAuthenticated]);

  const removeFromFavorites = useCallback(async (restaurantId: string): Promise<boolean> => {
    if (!isAuthenticated) {
      console.log('⚠️ User not authenticated, cannot remove favorite');
      return false;
    }

    try {
      console.log('💔 Removing from favorites:', restaurantId);
      const success = await FavoritesService.removeFromFavorites(restaurantId);
      
      if (success) {
        // Aggiorna lo stato locale immediatamente
        setFavorites(prev => prev.filter(fav => fav.id !== restaurantId));
        setFavoriteIds(prev => prev.filter(id => id !== restaurantId));
        
        console.log('✅ Favorite removed successfully');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error removing favorite:', error);
      return false;
    }
  }, [isAuthenticated]);

  const toggleFavorite = useCallback(async (restaurant: Restaurant): Promise<boolean> => {
    const isCurrentlyFavorite = favoriteIds.includes(restaurant.id);
    
    if (isCurrentlyFavorite) {
      return await removeFromFavorites(restaurant.id);
    } else {
      return await addToFavorites(restaurant);
    }
  }, [favoriteIds, addToFavorites, removeFromFavorites]);

  const clearAllFavorites = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) {
      console.log('⚠️ User not authenticated, cannot clear favorites');
      return false;
    }

    try {
      console.log('🗑️ Clearing all favorites...');
      const success = await FavoritesService.clearAllFavorites();
      
      if (success) {
        setFavorites([]);
        setFavoriteIds([]);
        console.log('✅ All favorites cleared');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error clearing favorites:', error);
      return false;
    }
  }, [isAuthenticated]);

  const isFavorite = useCallback((restaurantId: string): boolean => {
    return favoriteIds.includes(restaurantId);
  }, [favoriteIds]);

  const getFavoriteById = useCallback((restaurantId: string): FavoriteRestaurant | undefined => {
    return favorites.find(fav => fav.id === restaurantId);
  }, [favorites]);

  return {
    // State
    favorites,
    favoriteIds,
    loading,
    favoritesCount: favorites.length,
    
    // Actions
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    refreshFavorites,
    clearAllFavorites,
    
    // Utilities
    isFavorite,
    getFavoriteById,
  };
}

/**
 * Hook semplificato per controllare solo se un ristorante è preferito
 * Utile quando non serve l'intera lista dei preferiti
 */
export function useIsFavorite(restaurantId: string): {
  isFavorite: boolean;
  loading: boolean;
  toggle: () => Promise<boolean>;
} {
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    checkFavoriteStatus();
  }, [restaurantId, isAuthenticated]);

  const checkFavoriteStatus = async () => {
    if (!isAuthenticated || !restaurantId) {
      setIsFav(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const favorite = await FavoritesService.isFavorite(restaurantId);
      setIsFav(favorite);
    } catch (error) {
      console.error('❌ Error checking favorite status:', error);
      setIsFav(false);
    } finally {
      setLoading(false);
    }
  };

  const toggle = async (): Promise<boolean> => {
    // Questo hook è semplificato, per il toggle completo usa useFavorites
    console.log('⚠️ useIsFavorite.toggle() non implementato - usa useFavorites per azioni complete');
    return false;
  };

  return {
    isFavorite: isFav,
    loading,
    toggle,
  };
}

/**
 * Hook per ottenere solo il conteggio dei preferiti
 * Utile per badge o statistiche
 */
export function useFavoritesCount(): {
  count: number;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadCount();
    } else {
      setCount(0);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadCount = async () => {
    try {
      setLoading(true);
      const favoritesCount = await FavoritesService.getFavoritesCount();
      setCount(favoritesCount);
      console.log('📊 Favorites count loaded:', favoritesCount);
    } catch (error) {
      console.error('❌ Error loading favorites count:', error);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await loadCount();
  };

  return {
    count,
    loading,
    refresh,
  };
}

