const rateLimit = require('express-rate-limit');

/**
 * Rate limiter per proteggere le API da abuso
 * Limita il numero di richieste per IP
 */

// Rate limiter generale - 500 richieste per 15 minuti (per testing/development)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 500, // Limite di 500 richieste per finestra
  message: {
    error: 'Troppe richieste da questo IP, riprova tra 15 minuti'
  },
  standardHeaders: true, // Ritorna rate limit info negli headers `RateLimit-*`
  legacyHeaders: false, // Disabilita gli headers `X-RateLimit-*`
});

// Rate limiter per API esterne - 300 richieste per 15 minuti (più permissivo per testing)
// Nota: Google Places API ha un limite di 1000 richieste al giorno, quindi 300/15min è sicuro
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 300, // Limite di 300 richieste per finestra
  message: {
    error: 'Troppe richieste alle API esterne, riprova tra 15 minuti'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  apiLimiter
};
