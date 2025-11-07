const rateLimit = require('express-rate-limit');

/**
 * Rate limiter per proteggere le API da abuso
 * Limita il numero di richieste per IP
 */

// Rate limiter generale - 10000 richieste per 15 minuti (molto permissivo per testing)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 10000, // Limite di 10000 richieste per finestra (praticamente illimitato per testing)
  message: {
    error: 'Troppe richieste da questo IP, riprova tra 15 minuti'
  },
  standardHeaders: true, // Ritorna rate limit info negli headers `RateLimit-*`
  legacyHeaders: false, // Disabilita gli headers `X-RateLimit-*`
});

// Rate limiter per API esterne - 5000 richieste per 15 minuti (molto permissivo per testing)
// Nota: Durante testing è normale fare molte richieste. Google Places ha limite giornaliero.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5000, // Limite di 5000 richieste per finestra (praticamente illimitato per testing)
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
