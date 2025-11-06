import { supabase } from './supabase';
import { AuthService } from './authService';
import { RecommendationService, InteractionType } from './recommendationService';

export interface UserReview {
  id: string;
  placeId: string; // Google place_id
  restaurantName: string;
  userId: string;
  userDisplayName?: string;
  userAvatarUrl?: string;
  rating: number; // 1..5
  text: string;
  createdAt: string;
}

export class ReviewsService {
  static async listForPlace(placeId: string): Promise<UserReview[]> {
    try {
      const { data, error } = await supabase
        .from('user_reviews')
        .select('*')
        .eq('place_id', placeId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('❌ Supabase listForPlace error', error);
        return [];
      }
      return (data || []).map(this.mapFromDb);
    } catch (e) {
      console.error('❌ listForPlace error', e);
      return [];
    }
  }

  static async addReview(params: { placeId: string; restaurantName: string; rating: number; text: string; cuisineType?: string; priceLevel?: number }): Promise<boolean> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) return false;

      const normalizedRating = Math.max(1, Math.min(5, Math.round(params.rating)));

      const payload = {
        place_id: params.placeId,
        restaurant_name: params.restaurantName,
        user_id: user.id,
        rating: normalizedRating,
        text: params.text?.trim().slice(0, 2000) || '',
      };

      const { error } = await supabase.from('user_reviews').insert([payload]);
      if (error) {
        console.error('❌ addReview error', error);
        return false;
      }

      // Track interaction per raccomandazioni
      RecommendationService.trackInteraction(
        user.id,
        params.placeId,
        params.restaurantName,
        InteractionType.REVIEW,
        {
          cuisineType: params.cuisineType,
          priceLevel: params.priceLevel,
          rating: normalizedRating,
          isGuest: user.isGuest,
        }
      );

      return true;
    } catch (e) {
      console.error('❌ addReview error', e);
      return false;
    }
  }

  private static mapFromDb(row: any): UserReview {
    return {
      id: row.id,
      placeId: row.place_id,
      restaurantName: row.restaurant_name,
      userId: row.user_id,
      userDisplayName: row.user_display_name,
      userAvatarUrl: row.user_avatar_url,
      rating: row.rating,
      text: row.text,
      createdAt: row.created_at,
    };
  }
}



