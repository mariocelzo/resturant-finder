const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  priceLevel?: number;
  photoUrl?: string;
  isOpen?: boolean;
  cuisine_type?: string;
  phone?: string; // FIXED: Aggiunta proprietà phone mancante
}

// Import dei dati mock come fallback
import { mockRestaurants, searchNearbyRestaurants as mockSearch } from './mockData';

export const searchNearbyRestaurants = async (
  latitude: number,
  longitude: number,
  radius: number = 2000
): Promise<Restaurant[]> => {
  
  // Se non abbiamo API key, usa i mock
  if (!GOOGLE_API_KEY) {
    console.log('📄 GOOGLEPLACES: API Key mancante, usando mock data');
    return mockSearch(latitude, longitude, radius);
  }

  console.log('🌐 GOOGLEPLACES: Usando Google Places API');
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=restaurant&key=${GOOGLE_API_KEY}`;
  
  try {
    console.log('📡 GOOGLEPLACES: Chiamando API Google...');
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error_message) {
      console.error('❌ GOOGLEPLACES: Errore API:', data.error_message);
      console.log('📄 GOOGLEPLACES: Fallback ai mock data');
      return mockSearch(latitude, longitude, radius);
    }
    
    console.log('✅ GOOGLEPLACES: Ricevuti', data.results?.length || 0, 'risultati da Google');
    
    return data.results.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      rating: place.rating || 0,
      priceLevel: place.price_level,
      photoUrl: place.photos?.[0] 
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
        : undefined,
      isOpen: place.opening_hours?.open_now,
      cuisine_type: place.types?.find((type: string) => 
        ['restaurant', 'food', 'meal_takeaway', 'meal_delivery'].includes(type)
      ) || 'Restaurant',
      phone: place.formatted_phone_number // FIXED: Aggiunto mapping per telefono
    }));
  } catch (error) {
    console.error('❌ GOOGLEPLACES: Errore di rete, usando fallback:', error);
    console.log('📄 GOOGLEPLACES: Fallback ai mock data');
    return mockSearch(latitude, longitude, radius);
  }
};