const express = require('express');
const router = express.Router();
const placesController = require('../controllers/placesController');

/**
 * Routes per Google Places API
 * Tutte le chiamate passano attraverso questo proxy per nascondere le API keys
 */

// Cerca ristoranti nelle vicinanze
// GET /api/places/nearby?latitude=45.4642&longitude=9.1900&radius=5000
router.get('/nearby', placesController.searchNearby);

// Dettagli di un luogo specifico
// GET /api/places/details/:placeId
router.get('/details/:placeId', placesController.getPlaceDetails);

// URL foto di un luogo
// GET /api/places/photo/:photoReference?maxwidth=400
router.get('/photo/:photoReference', placesController.getPhoto);

// Autocomplete per indirizzi
// GET /api/places/autocomplete?input=Milano&types=geocode
router.get('/autocomplete', placesController.autocomplete);

// Geocoding - converti indirizzo in coordinate
// GET /api/places/geocode?address=Milano
router.get('/geocode', placesController.geocode);

module.exports = router;
