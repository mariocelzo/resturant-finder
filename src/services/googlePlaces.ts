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

function classifyCuisine(name: string, types: string[] = []): string {
  const n = (name || '').toLowerCase();
  const t = (types || []).map((x) => x.toLowerCase());

  const has = (word: string) => n.includes(word);
  const typeHas = (word: string) => t.includes(word);

  // Specific cuisine types from Google
  if (typeHas('italian_restaurant')) return 'Italiano';
  if (typeHas('japanese_restaurant')) return 'Giapponese';
  if (typeHas('chinese_restaurant')) return 'Cinese';
  if (typeHas('indian_restaurant')) return 'Indiano';
  if (typeHas('mexican_restaurant')) return 'Messicano';
  if (typeHas('thai_restaurant')) return 'Thai';
  if (typeHas('korean_restaurant')) return 'Coreano';
  if (typeHas('mediterranean_restaurant')) return 'Mediterranea';
  if (typeHas('seafood_restaurant')) return 'Seafood';
  if (typeHas('vegan_restaurant')) return 'Vegano';
  if (typeHas('vegetarian_restaurant')) return 'Vegetariana';

  // Keyword-based
  if (has('pizza') || has('pizzeria')) return 'Pizzeria';
  if (has('sushi')) return 'Sushi';
  if (has('ramen')) return 'Giapponese';
  if (has('udon')) return 'Giapponese';
  if (has('izakaya')) return 'Giapponese';
  if (has('noodle') || has('noodles')) return 'Asiatica';
  if (has('kebab') || has('shawarma') || has('doner') || has('dürüm')) return 'Kebab';
  if (has('burger') || has('hambur')) return 'Burger';
  if (has('panini') || has('panino') || has('sandwich') || has('subs')) return 'Panini';
  if (has('bbq') || has('barbecue') || has('smokehouse')) return 'BBQ';
  if (has('steak') || has('braceria') || has('grill')) return 'Steakhouse';
  if (has('trattoria') || has('osteria')) return 'Trattoria';
  if (has('vegan')) return 'Vegano';
  if (has('vegetar')) return 'Vegetariana';
  if (has('poke')) return 'Poke';
  if (has('fish') || has('pesce') || has('marisquer') || has('mariscos')) return 'Seafood';
  if (has('taco') || has('burrito') || has('mex')) return 'Messicano';
  if (has('curry') || has('tandoor') || has('masala')) return 'Indiano';
  if (has('gnocchi') || has('pasta')) return 'Italiano';

  if (typeHas('fast_food')) return 'Fast Food';

  return 'Restaurant';
}

export const searchNearbyRestaurants = async (
  latitude: number,
  longitude: number,
  radius: number = 2000,
  maxResults: number = 60
): Promise<Restaurant[]> => {
  
  // Se non abbiamo API key, usa i mock
  if (!GOOGLE_API_KEY) {
    console.log('📄 GOOGLEPLACES: API Key mancante, usando mock data');
    return mockSearch(latitude, longitude, radius);
  }

  console.log('🌐 GOOGLEPLACES: Usando Google Places API');
  // Nearby Search supporta radius fino a 50km; clamp per evitare errori
  const clampedRadius = Math.min(Math.max(radius, 1), 50000);

  const mapPlace = (place: any): Restaurant => ({
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
    phone: place.formatted_phone_number
  });

  try {
    const all: Restaurant[] = [];
    const seen = new Set<string>();
    let pageToken: string | null = null;
    let pagesFetched = 0;

    do {
      const base = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
      const url: string = pageToken
        ? `${base}?pagetoken=${encodeURIComponent(pageToken)}&key=${GOOGLE_API_KEY}`
        : `${base}?location=${latitude},${longitude}&radius=${clampedRadius}&type=restaurant&key=${GOOGLE_API_KEY}`;

      console.log('📡 GOOGLEPLACES: Fetch page', pagesFetched + 1, pageToken ? '(token present)' : '(initial)');
      const res: any = await fetch(url);
      const data: any = await res.json();

      if (data.error_message) {
        console.error('❌ GOOGLEPLACES: Errore API:', data.error_message);
        break;
      }

      if (data.status === 'INVALID_REQUEST' && pageToken) {
        // Token not ready yet; wait and retry once
        console.log('⏳ Token non pronto, attendo e riprovo...');
        await new Promise(r => setTimeout(r, 1600));
        const retryRes: any = await fetch(url);
        const retryData: any = await retryRes.json();
        if (retryData.status === 'OK') {
          data.results = retryData.results;
          data.next_page_token = retryData.next_page_token;
          data.status = retryData.status;
        } else {
          console.warn('⚠️ Autopagina non disponibile, interrompo paginazione:', retryData.status);
          break;
        }
      }

      let pageResults = (data.results || []) as any[];

      // Escludi hotel/B&B/strutture ricettive
      const isLodging = (types: string[] = []) => {
        const lt = types.map((x) => x.toLowerCase());
        return lt.includes('lodging') || lt.includes('hotel') || lt.includes('motel') || lt.includes('hostel') || lt.includes('guest_house') || lt.includes('bed_and_breakfast');
      };
      pageResults = pageResults.filter((p) => !isLodging(p.types));

      for (const p of pageResults) {
        if (!seen.has(p.place_id)) {
          seen.add(p.place_id);
          const mapped = mapPlace(p);
          mapped.cuisine_type = classifyCuisine(p.name, p.types);
          all.push(mapped);
        }
      }

      pagesFetched += 1;
      pageToken = data.next_page_token && all.length < maxResults ? data.next_page_token : null;

      if (pageToken) {
        // Attendi un po' prima di chiedere la pagina successiva
        await new Promise(r => setTimeout(r, 1600));
      }
    } while (pageToken && pagesFetched < 3 && all.length < maxResults);

    console.log('✅ GOOGLEPLACES: Totale aggregato', all.length, 'ristoranti');
    return all;
  } catch (error) {
    console.error('❌ GOOGLEPLACES: Errore di rete, usando fallback:', error);
    console.log('📄 GOOGLEPLACES: Fallback ai mock data');
    return mockSearch(latitude, longitude, radius);
  }
};

export interface GeocodedLocation {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export const geocodeLocation = async (query: string): Promise<GeocodedLocation | null> => {
  if (!query || !query.trim()) return null;

  if (!GOOGLE_API_KEY) {
    console.log('📄 GEOCODING: API Key mancante, geocoding non disponibile');
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status !== 'OK' || !data.results?.length) {
      console.warn('⚠️ GEOCODING: Nessun risultato per', query, data.status);
      return null;
    }
    const result = data.results[0];
    return {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
    };
  } catch (error) {
    console.error('❌ GEOCODING: Errore', error);
    return null;
  }
};

export interface PlaceSuggestion {
  description: string;
  placeId: string;
}

export const placesAutocomplete = async (query: string): Promise<PlaceSuggestion[]> => {
  if (!GOOGLE_API_KEY) {
    return [];
  }
  if (!query || !query.trim()) return [];
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK') return [];
    return (data.predictions || []).map((p: any) => ({ description: p.description, placeId: p.place_id }));
  } catch (e) {
    console.error('❌ AUTOCOMPLETE: Errore', e);
    return [];
  }
};

export const getPlaceDetails = async (placeId: string): Promise<GeocodedLocation | null> => {
  if (!GOOGLE_API_KEY) return null;
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=geometry/location,formatted_address&key=${GOOGLE_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK' || !data.result) return null;
    const loc = data.result.geometry.location;
    return {
      latitude: loc.lat,
      longitude: loc.lng,
      formattedAddress: data.result.formatted_address,
    };
  } catch (e) {
    console.error('❌ PLACE DETAILS: Errore', e);
    return null;
  }
};
