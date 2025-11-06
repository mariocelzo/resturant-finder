import type { Restaurant } from './googlePlaces';
export type { Restaurant } from './googlePlaces';
import { mockRestaurants, searchNearbyRestaurants as mockSearch, getMockReviews } from './mockData';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const _nearbyCache: Map<string, { ts: number; data: Restaurant[] }> = new Map();
const TTL_MS = 120_000; // 2 minuti

let placesService: google.maps.places.PlacesService | null = null;
let mapsLibrary: google.maps.MapsLibrary | null = null;
let placesLibrary: google.maps.PlacesLibrary | null = null;

// Carica le librerie Google Maps
async function loadGoogleMaps() {
  if (!GOOGLE_API_KEY) {
    console.error('❌ loadGoogleMaps: API key mancante');
    return false;
  }

  try {
    // Importa le librerie usando la nuova API
    if (!window.google?.maps) {
      console.log('📦 loadGoogleMaps: Caricamento Google Maps SDK...');

      // Crea il tag script manualmente
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&callback=Function.prototype`;
      script.async = true;
      script.defer = true;

      await new Promise<void>((resolve, reject) => {
        script.onload = () => {
          console.log('✅ loadGoogleMaps: Google Maps SDK caricato');
          resolve();
        };
        script.onerror = () => {
          console.error('❌ loadGoogleMaps: Errore caricamento script');
          reject(new Error('Errore caricamento Google Maps SDK'));
        };
        document.head.appendChild(script);
      });
    } else {
      console.log('✅ loadGoogleMaps: Google Maps già caricato');
    }

    return true;
  } catch (e) {
    console.error('❌ loadGoogleMaps: Errore caricamento:', e);
    return false;
  }
}

// Ottieni il servizio Places
async function getPlacesService(): Promise<google.maps.places.PlacesService | null> {
  if (!GOOGLE_API_KEY) {
    console.error('❌ getPlacesService: API key mancante');
    return null;
  }

  if (!placesService) {
    try {
      // Carica Google Maps SDK
      const loaded = await loadGoogleMaps();
      if (!loaded) {
        console.error('❌ getPlacesService: Impossibile caricare Google Maps SDK');
        return null;
      }

      // Crea un div nascosto per il PlacesService (richiesto dall'API)
      const mapDiv = document.createElement('div');
      mapDiv.style.display = 'none';
      document.body.appendChild(mapDiv);

      console.log('🗺️ getPlacesService: Creazione Map...');
      const map = new google.maps.Map(mapDiv, {
        center: { lat: 0, lng: 0 },
        zoom: 1
      });

      console.log('🏪 getPlacesService: Creazione PlacesService...');
      placesService = new google.maps.places.PlacesService(map);
      console.log('✅ getPlacesService: PlacesService creato con successo');
    } catch (e) {
      console.error('❌ Errore caricamento Google Maps:', e);
      console.error('❌ Dettagli errore:', e);
      return null;
    }
  } else {
    console.log('💾 getPlacesService: PlacesService già esistente');
  }
  return placesService;
}

function makeKey(lat: number, lng: number, radius: number, maxResults: number): string {
  const rl = Number.isFinite(radius) ? Math.min(Math.max(radius, 1), 50000) : 2000;
  const latK = lat.toFixed(4);
  const lngK = lng.toFixed(4);
  return `${latK},${lngK},${rl},${maxResults}`;
}

function classifyCuisine(name: string, types: string[] = []): string {
  const n = (name || '').toLowerCase();
  const t = (types || []).map((x) => x.toLowerCase());

  const has = (word: string) => n.includes(word);
  const typeHas = (word: string) => t.includes(word);

  // Specific cuisine types
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
  if (typeHas('cafe')) return 'Caffè';
  if (typeHas('bar')) return 'Bar';
  if (typeHas('bakery')) return 'Dessert';

  // Keyword-based
  if (has('pizza') || has('pizzeria')) return 'Pizzeria';
  if (has('sushi')) return 'Sushi';
  if (has('ramen') || has('udon') || has('izakaya')) return 'Giapponese';
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
  if (has('pasticceria') || has('pasticc') || has('dolci') || has('dessert') || has('cake') || has('gelato')) return 'Dessert';
  if (has('cafe') || has('cafè') || has('caffè') || has('coffee')) return 'Caffè';
  if (has('bar ') || n.startsWith('bar ') || has('pub')) return 'Bar';
  if (typeHas('fast_food')) return 'Fast Food';

  return 'Restaurant';
}

export const searchNearbyRestaurants = async (
  latitude: number,
  longitude: number,
  radius: number = 2000,
  maxResults: number = 60
): Promise<Restaurant[]> => {
  console.log('🔍 GOOGLEPLACES WEB: searchNearbyRestaurants chiamata con:', {
    latitude,
    longitude,
    radius,
    maxResults,
    hasApiKey: !!GOOGLE_API_KEY
  });

  const key = makeKey(latitude, longitude, radius, maxResults);
  const now = Date.now();
  const cached = _nearbyCache.get(key);

  if (cached && (now - cached.ts) < TTL_MS) {
    console.log('💾 GOOGLEPLACES WEB: Usando cache per', { latitude, longitude });
    return cached.data;
  }

  // Se non abbiamo API key, usa i mock
  if (!GOOGLE_API_KEY) {
    console.log('📄 GOOGLEPLACES WEB: API Key mancante, usando mock data');
    const data = await mockSearch(latitude, longitude, radius);
    _nearbyCache.set(key, { ts: now, data });
    return data;
  }

  console.log('🌐 GOOGLEPLACES WEB: Usando Google Maps JavaScript API per lat:', latitude, 'lng:', longitude);

  try {
    const service = await getPlacesService();
    if (!service) {
      console.log('⚠️ GOOGLEPLACES WEB: Servizio non disponibile, usando mock');
      const data = await mockSearch(latitude, longitude, radius);
      _nearbyCache.set(key, { ts: now, data });
      return data;
    }

    const clampedRadius = Math.min(Math.max(radius, 1), 50000);

    return new Promise((resolve) => {
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(latitude, longitude),
        radius: clampedRadius,
        type: 'restaurant'
      };

      service.nearbySearch(request, (results, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
          console.warn('⚠️ GOOGLEPLACES WEB: Errore ricerca, usando mock:', status);
          mockSearch(latitude, longitude, radius).then(data => {
            _nearbyCache.set(key, { ts: now, data });
            resolve(data);
          });
          return;
        }

        console.log('✅ GOOGLEPLACES WEB: Trovati', results.length, 'ristoranti');

        // Filtra hotel e B&B
        const filtered = results.filter(place => {
          const types = place.types || [];
          return !types.some(t =>
            ['lodging', 'hotel', 'motel', 'hostel', 'guest_house', 'bed_and_breakfast'].includes(t)
          );
        });

        const restaurants: Restaurant[] = filtered.slice(0, maxResults).map((place): Restaurant => ({
          id: place.place_id || String(Math.random()),
          name: place.name || 'Sconosciuto',
          address: place.vicinity || '',
          latitude: place.geometry?.location?.lat() || latitude,
          longitude: place.geometry?.location?.lng() || longitude,
          rating: place.rating || 0,
          priceLevel: place.price_level,
          photoUrl: place.photos?.[0]
            ? place.photos[0].getUrl({ maxWidth: 400 })
            : undefined,
          isOpen: place.opening_hours?.isOpen?.(),
          cuisine_type: classifyCuisine(place.name || '', place.types || []),
          phone: undefined // Non disponibile in nearbySearch
        }));

        console.log('✅ GOOGLEPLACES WEB: Processati', restaurants.length, 'ristoranti');
        _nearbyCache.set(key, { ts: now, data: restaurants });
        resolve(restaurants);
      });
    });
  } catch (error) {
    console.error('❌ GOOGLEPLACES WEB: Errore, usando mock:', error);
    const data = await mockSearch(latitude, longitude, radius);
    _nearbyCache.set(key, { ts: now, data });
    return data;
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
    console.log('📄 GEOCODING WEB: API Key mancante');
    return null;
  }

  try {
    const loaded = await loadGoogleMaps();
    if (!loaded) {
      console.error('❌ GEOCODING WEB: Google Maps non disponibile');
      return null;
    }

    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve) => {
      geocoder.geocode({ address: query }, (results, status) => {
        if (status !== google.maps.GeocoderStatus.OK || !results || !results.length) {
          console.warn('⚠️ GEOCODING WEB: Nessun risultato per', query);
          resolve(null);
          return;
        }

        const result = results[0];
        const location = result.geometry.location;

        console.log('✅ GEOCODING WEB: Trovato:', {
          query,
          lat: location.lat(),
          lng: location.lng(),
          address: result.formatted_address
        });

        resolve({
          latitude: location.lat(),
          longitude: location.lng(),
          formattedAddress: result.formatted_address || query
        });
      });
    });
  } catch (error) {
    console.error('❌ GEOCODING WEB: Errore', error);
    return null;
  }
};

export interface PlaceSuggestion {
  description: string;
  placeId: string;
}

export const placesAutocomplete = async (query: string): Promise<PlaceSuggestion[]> => {
  if (!GOOGLE_API_KEY) return [];
  if (!query || !query.trim()) return [];

  try {
    const loaded = await loadGoogleMaps();
    if (!loaded) return [];

    const service = new google.maps.places.AutocompleteService();

    return new Promise((resolve) => {
      service.getPlacePredictions({ input: query }, (predictions, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
          resolve([]);
          return;
        }

        resolve(predictions.map(p => ({
          description: p.description,
          placeId: p.place_id
        })));
      });
    });
  } catch (e) {
    console.error('❌ AUTOCOMPLETE WEB: Errore', e);
    return [];
  }
};

export const getPlaceDetails = async (placeId: string): Promise<GeocodedLocation | null> => {
  if (!GOOGLE_API_KEY) return null;

  try {
    const service = await getPlacesService();
    if (!service) return null;

    return new Promise((resolve) => {
      service.getDetails(
        { placeId, fields: ['geometry', 'formatted_address'] },
        (place, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
            resolve(null);
            return;
          }

          const location = place.geometry?.location;
          if (!location) {
            resolve(null);
            return;
          }

          resolve({
            latitude: location.lat(),
            longitude: location.lng(),
            formattedAddress: place.formatted_address || ''
          });
        }
      );
    });
  } catch (e) {
    console.error('❌ PLACE DETAILS WEB: Errore', e);
    return null;
  }
};

export interface PlaceReview {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  relativeTime: string;
  profilePhotoUrl?: string;
  language?: string;
}

export const fetchPlaceReviews = async (placeId: string, max: number = 10): Promise<PlaceReview[]> => {
  if (!placeId) return [];

  if (!GOOGLE_API_KEY) {
    console.log('📄 REVIEWS WEB: API Key mancante, usando mock');
    return getMockReviews(placeId).slice(0, max);
  }

  try {
    const service = await getPlacesService();
    if (!service) {
      console.log('⚠️ REVIEWS WEB: Servizio non disponibile, usando mock');
      return getMockReviews(placeId).slice(0, max);
    }

    return new Promise((resolve) => {
      service.getDetails(
        { placeId, fields: ['reviews'] },
        (place, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !place?.reviews) {
            console.log('⚠️ REVIEWS WEB: Nessuna recensione, usando mock');
            resolve(getMockReviews(placeId).slice(0, max));
            return;
          }

          const reviews: PlaceReview[] = place.reviews.slice(0, max).map((r, idx) => ({
            id: `${r.author_name || 'review'}_${r.time || idx}`,
            authorName: r.author_name || 'Anonimo',
            rating: r.rating || 0,
            text: r.text || '',
            relativeTime: r.relative_time_description || '',
            profilePhotoUrl: r.profile_photo_url,
            language: r.language
          }));

          resolve(reviews);
        }
      );
    });
  } catch (e) {
    console.error('❌ REVIEWS WEB: Errore, usando mock', e);
    return getMockReviews(placeId).slice(0, max);
  }
};
