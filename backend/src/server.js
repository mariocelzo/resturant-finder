require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const placesRoutes = require('./routes/places');
const { generalLimiter, apiLimiter } = require('./middleware/rateLimiter');

// Inizializza Express app
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * NearBite Backend Proxy
 *
 * Questo server fa da proxy per le API esterne (Google Places)
 * nascondendo le API keys dal client e aggiungendo rate limiting
 * per prevenire abusi.
 */

// Middleware di sicurezza
app.use(helmet()); // Aggiunge headers di sicurezza
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
})); // Abilita CORS

// Middleware per parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger delle richieste
app.use(morgan('combined'));

// Rate limiting generale
app.use(generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'nearbite-backend',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'NearBite Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      places: '/api/places/*'
    }
  });
});

// Routes per Google Places API (con rate limiting più restrittivo)
app.use('/api/places', apiLimiter, placesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Errore:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Errore interno del server',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint non trovato',
    path: req.path
  });
});

// Avvia server
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 ========================================');
  console.log('🚀  NearBite Backend Proxy');
  console.log('🚀 ========================================');
  console.log(`🚀  Server in ascolto su porta ${PORT}`);
  console.log(`🚀  Health check: http://localhost:${PORT}/health`);
  console.log(`🚀  API Places: http://localhost:${PORT}/api/places`);
  console.log('🚀 ========================================');
  console.log('');

  // Verifica che le API keys siano configurate
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.warn('⚠️  ATTENZIONE: GOOGLE_PLACES_API_KEY non configurata!');
  }
  if (!process.env.SUPABASE_URL) {
    console.warn('⚠️  ATTENZIONE: SUPABASE_URL non configurata!');
  }
  if (!process.env.SUPABASE_ANON_KEY) {
    console.warn('⚠️  ATTENZIONE: SUPABASE_ANON_KEY non configurata!');
  }
});

// Gestione graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM ricevuto, chiusura graceful...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT ricevuto, chiusura graceful...');
  process.exit(0);
});
