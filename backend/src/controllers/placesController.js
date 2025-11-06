const axios = require('axios');

// Base URL per Google Places API
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

/**
 * Controller per gestire le richieste a Google Places API
 * Nasconde le API keys dal client e gestisce rate limiting
 */

// Cache in memoria per ridurre chiamate API (2 minuti TTL)
const cache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minuti

// Funzione helper per gestire la cache
function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedData(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Cerca ristoranti nelle vicinanze
 * GET /api/places/nearby
 */
exports.searchNearby = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000, type = 'restaurant', pagetoken } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Parametri latitude e longitude sono obbligatori'
      });
    }

    // Crea chiave cache
    const cacheKey = `nearby_${latitude}_${longitude}_${radius}_${type}_${pagetoken || 'page1'}`;

    // Controlla cache
    const cachedResult = getCachedData(cacheKey);
    if (cachedResult) {
      console.log('📦 Cache hit:', cacheKey);
      return res.json(cachedResult);
    }

    console.log('🌐 Chiamata API Google Places - Nearby Search');

    // Costruisci URL
    const url = `${GOOGLE_PLACES_BASE_URL}/nearbysearch/json`;
    const params = {
      location: `${latitude},${longitude}`,
      radius,
      type,
      key: process.env.GOOGLE_PLACES_API_KEY
    };

    // Aggiungi pagetoken se presente
    if (pagetoken) {
      params.pagetoken = pagetoken;
    }

    // Chiamata a Google Places API
    const response = await axios.get(url, { params });

    // Cache del risultato
    setCachedData(cacheKey, response.data);

    res.json(response.data);

  } catch (error) {
    console.error('❌ Errore Google Places API:', error.message);
    res.status(500).json({
      error: 'Errore nella ricerca dei ristoranti',
      message: error.message
    });
  }
};

/**
 * Ottieni dettagli di un luogo specifico
 * GET /api/places/details/:placeId
 */
exports.getPlaceDetails = async (req, res) => {
  try {
    const { placeId } = req.params;
    const { fields } = req.query;

    if (!placeId) {
      return res.status(400).json({
        error: 'placeId è obbligatorio'
      });
    }

    // Cache key
    const cacheKey = `details_${placeId}_${fields || 'all'}`;
    const cachedResult = getCachedData(cacheKey);
    if (cachedResult) {
      console.log('📦 Cache hit:', cacheKey);
      return res.json(cachedResult);
    }

    console.log('🌐 Chiamata API Google Places - Place Details');

    const url = `${GOOGLE_PLACES_BASE_URL}/details/json`;
    const params = {
      place_id: placeId,
      key: process.env.GOOGLE_PLACES_API_KEY
    };

    if (fields) {
      params.fields = fields;
    }

    const response = await axios.get(url, { params });

    setCachedData(cacheKey, response.data);

    res.json(response.data);

  } catch (error) {
    console.error('❌ Errore Google Places API:', error.message);
    res.status(500).json({
      error: 'Errore nel recupero dettagli luogo',
      message: error.message
    });
  }
};

/**
 * Ottieni foto di un luogo
 * GET /api/places/photo/:photoReference
 */
exports.getPhoto = async (req, res) => {
  try {
    const { photoReference } = req.params;
    const { maxwidth = 400 } = req.query;

    if (!photoReference) {
      return res.status(400).json({
        error: 'photoReference è obbligatorio'
      });
    }

    console.log('🌐 Chiamata API Google Places - Photo');

    const url = `${GOOGLE_PLACES_BASE_URL}/photo`;
    const params = {
      photoreference: photoReference,
      maxwidth,
      key: process.env.GOOGLE_PLACES_API_KEY
    };

    // Per le foto, ritorniamo l'URL costruito
    const photoUrl = `${url}?${new URLSearchParams(params).toString()}`;

    res.json({ photoUrl });

  } catch (error) {
    console.error('❌ Errore Google Places API:', error.message);
    res.status(500).json({
      error: 'Errore nel recupero foto',
      message: error.message
    });
  }
};

/**
 * Autocomplete per indirizzi
 * GET /api/places/autocomplete
 */
exports.autocomplete = async (req, res) => {
  try {
    const { input, types = 'geocode' } = req.query;

    if (!input) {
      return res.status(400).json({
        error: 'Parametro input è obbligatorio'
      });
    }

    // Cache key
    const cacheKey = `autocomplete_${input}_${types}`;
    const cachedResult = getCachedData(cacheKey);
    if (cachedResult) {
      console.log('📦 Cache hit:', cacheKey);
      return res.json(cachedResult);
    }

    console.log('🌐 Chiamata API Google Places - Autocomplete');

    const url = `${GOOGLE_PLACES_BASE_URL}/autocomplete/json`;
    const params = {
      input,
      types,
      key: process.env.GOOGLE_PLACES_API_KEY
    };

    const response = await axios.get(url, { params });

    setCachedData(cacheKey, response.data);

    res.json(response.data);

  } catch (error) {
    console.error('❌ Errore Google Places API:', error.message);
    res.status(500).json({
      error: 'Errore nell\'autocomplete',
      message: error.message
    });
  }
};

/**
 * Geocoding - converti indirizzo in coordinate
 * GET /api/places/geocode
 */
exports.geocode = async (req, res) => {
  try {
    const { address, placeId } = req.query;

    if (!address && !placeId) {
      return res.status(400).json({
        error: 'Parametro address o placeId è obbligatorio'
      });
    }

    // Cache key
    const cacheKey = `geocode_${address || placeId}`;
    const cachedResult = getCachedData(cacheKey);
    if (cachedResult) {
      console.log('📦 Cache hit:', cacheKey);
      return res.json(cachedResult);
    }

    console.log('🌐 Chiamata API Google Geocoding');

    const url = 'https://maps.googleapis.com/maps/api/geocode/json';
    const params = {
      key: process.env.GOOGLE_PLACES_API_KEY
    };

    if (placeId) {
      params.place_id = placeId;
    } else {
      params.address = address;
    }

    const response = await axios.get(url, { params });

    setCachedData(cacheKey, response.data);

    res.json(response.data);

  } catch (error) {
    console.error('❌ Errore Google Geocoding API:', error.message);
    res.status(500).json({
      error: 'Errore nel geocoding',
      message: error.message
    });
  }
};
