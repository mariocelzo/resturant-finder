const rateLimit = require('express-rate-limit');

/**
 * Rate limiter per proteggere le API da abuso
 * Limita il numero di richieste per IP
 */

// Rate limiter generale - 100 richieste per 15 minuti
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // Limite di 100 richieste per finestra
  message: {
    error: 'Troppe richieste da questo IP, riprova tra 15 minuti'
  },
  standardHeaders: true, // Ritorna rate limit info negli headers `RateLimit-*`
  legacyHeaders: false, // Disabilita gli headers `X-RateLimit-*`
});

// Rate limiter più restrittivo per chiamate API esterne - 50 richieste per 15 minuti
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 50, // Limite di 50 richieste per finestra
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
