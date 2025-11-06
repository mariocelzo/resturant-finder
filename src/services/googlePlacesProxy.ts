/**
 * Google Places Proxy Service
 *
 * Questo servizio usa il backend proxy invece di chiamare direttamente Google Places API.
 * Le API keys sono protette server-side e nascoste dal client.
 *
 * Per abilitare la modalità proxy, imposta:
 * EXPO_PUBLIC_USE_BACKEND_PROXY=true
 * EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
 */

import { Restaurant } from './googlePlaces';
import { mockRestaurants, searchNearbyRestaurants as mockSearch } from './mockData';

// Configurazione
const USE_PROXY = process.env.EXPO_PUBLIC_USE_BACKEND_PROXY === 'true';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Cache locale (stessa logica del servizio originale)
const _nearbyCache: Map<string, { ts: number; data: Restaurant[] }> = new Map();
const _inflight: Map<string, Promise<Restaurant[]>> = new Map();
const TTL_MS = 120_000; // 2 minuti

function makeKey(lat: number, lng: number, radius: number, maxResults: number): string {
  const rl = Number.isFinite(radius) ? Math.min(Math.max(radius, 1), 50000) : 2000;
  const latK = lat.toFixed(4);
  const lngK = lng.toFixed(4);
  return `${latK},${lngK},${rl},${maxResults},proxy`;
}

/**
 * Classifica il tipo di cucina in base al nome e ai tipi
 */
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
  // Non-restaurant food places
  if (typeHas('cafe')) return 'Caffè';
  if (typeHas('bar')) return 'Bar';
  if (typeHas('bakery')) return 'Dessert';

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
  // Dessert and sweets
  if (has('pasticceria') || has('pasticc') || has('pasticcini') || has('dolci') || has('dessert') || has('cake') || has('torta') || has('gelato')) return 'Dessert';
  // Cafè / Coffee shop
  if (has('cafe') || has('cafè') || has('caffè') || has('coffee')) return 'Caffè';
  // Bar / Pub
  if (has('bar ') || n.startsWith('bar ') || has('pub')) return 'Bar';

  if (typeHas('fast_food')) return 'Fast Food';

  return 'Restaurant';
}

/**
 * Cerca ristoranti nelle vicinanze tramite backend proxy
 */
export const searchNearbyRestaurants = async (
  latitude: number,
  longitude: number,
  radius: number = 2000,
  maxResults: number = 60
): Promise<Restaurant[]> => {
  const key = makeKey(latitude, longitude, radius, maxResults);
  const now = Date.now();

  // Controlla cache
  const cached = _nearbyCache.get(key);
  if (cached && (now - cached.ts) < TTL_MS) {
    console.log('📦 Cache hit (proxy)');
    return cached.data;
  }

  // Controlla se c'è già una richiesta in corso
  const inflight = _inflight.get(key);
  if (inflight) {
    console.log('⏳ Richiesta già in corso, attendo...');
    return inflight;
  }

  // Wrapper per salvare in cache al termine
  const exec = (async () => {
    try {
      console.log(`🌐 Chiamata a backend proxy: ${BACKEND_URL}/api/places/nearby`);

      const clampedRadius = Math.min(Math.max(radius, 1), 50000);

      const all: Restaurant[] = [];
      const seen = new Set<string>();
      let pageToken: string | null = null;
      let pagesFetched = 0;

      do {
        // Costruisci URL con parametri
        const params = new URLSearchParams({
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          radius: clampedRadius.toString(),
          type: 'restaurant'
        });

        if (pageToken) {
          params.append('pagetoken', pageToken);
        }

        const url = `${BACKEND_URL}/api/places/nearby?${params.toString()}`;

        console.log(`📡 Fetching page ${pagesFetched + 1}...`);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Backend proxy error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error_message) {
          console.error('❌ Errore dal backend:', data.error_message);
          break;
        }

        // Mappa i risultati al nostro formato Restaurant
        const pageResults = (data.results || [])
          .filter((place: any) => {
            // Escludi hotel/B&B/strutture ricettive
            const types = (place.types || []).map((t: string) => t.toLowerCase());
            return !types.some((t: string) =>
              ['lodging', 'hotel', 'motel', 'hostel', 'guest_house', 'bed_and_breakfast'].includes(t)
            );
          })
          .map((place: any): Restaurant => ({
            id: place.place_id,
            name: place.name,
            address: place.vicinity,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            rating: place.rating || 0,
            priceLevel: place.price_level,
            photoUrl: place.photos?.[0]?.photo_reference
              ? `${BACKEND_URL}/api/places/photo/${place.photos[0].photo_reference}?maxwidth=400`
              : undefined,
            isOpen: place.opening_hours?.open_now,
            cuisine_type: classifyCuisine(place.name, place.types),
            phone: place.formatted_phone_number
          }));

        // Aggiungi i risultati evitando duplicati
        for (const restaurant of pageResults) {
          if (!seen.has(restaurant.id)) {
            seen.add(restaurant.id);
            all.push(restaurant);
          }
        }

        pagesFetched += 1;
        pageToken = data.next_page_token && all.length < maxResults ? data.next_page_token : null;

        if (pageToken) {
          // Attendi prima di chiedere la pagina successiva
          await new Promise(r => setTimeout(r, 1600));
        }
      } while (pageToken && pagesFetched < 3 && all.length < maxResults);

      console.log(`✅ Totale ristoranti trovati: ${all.length}`);

      // Salva in cache
      _nearbyCache.set(key, { ts: now, data: all });
      return all;

    } catch (error) {
      console.error('❌ Errore nella ricerca tramite proxy:', error);

      // Fallback a mock data in caso di errore
      console.log('📄 Usando mock data come fallback');
      const mockData = await mockSearch(latitude, longitude, radius);
      _nearbyCache.set(key, { ts: now, data: mockData });
      return mockData;
    }
  })();

  // Salva la promise in corso
  _inflight.set(key, exec);

  // Rimuovi dalla mappa quando completata
  exec.finally(() => {
    _inflight.delete(key);
  });

  return exec;
};

/**
 * Ottieni dettagli di un ristorante tramite backend proxy
 */
export const getRestaurantDetails = async (placeId: string): Promise<any> => {
  try {
    console.log(`🌐 Fetching details for place: ${placeId}`);

    const url = `${BACKEND_URL}/api/places/details/${placeId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Backend proxy error: ${response.status}`);
    }

    const data = await response.json();
    return data.result;

  } catch (error) {
    console.error('❌ Errore nel recupero dettagli:', error);
    throw error;
  }
};

/**
 * Autocomplete per indirizzi tramite backend proxy
 */
export const autocompleteAddress = async (input: string): Promise<any[]> => {
  try {
    const params = new URLSearchParams({
      input,
      types: 'geocode'
    });

    const url = `${BACKEND_URL}/api/places/autocomplete?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Backend proxy error: ${response.status}`);
    }

    const data = await response.json();
    return data.predictions || [];

  } catch (error) {
    console.error('❌ Errore nell\'autocomplete:', error);
    return [];
  }
};

/**
 * Geocoding tramite backend proxy
 */
export const geocodeAddress = async (address: string): Promise<any> => {
  try {
    const params = new URLSearchParams({ address });
    const url = `${BACKEND_URL}/api/places/geocode?${params.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Backend proxy error: ${response.status}`);
    }

    const data = await response.json();
    return data.results?.[0];

  } catch (error) {
    console.error('❌ Errore nel geocoding:', error);
    throw error;
  }
};

// Log della configurazione all'avvio
console.log('🔧 Google Places Service Configuration:');
console.log(`   - Use Proxy: ${USE_PROXY}`);
console.log(`   - Backend URL: ${BACKEND_URL}`);
