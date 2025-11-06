# NearBite Backend Proxy

Backend proxy server per NearBite che protegge le API keys e gestisce le chiamate a Google Places API.

## Perché questo backend?

Questo backend risolve il problema della sicurezza delle API keys:

- **Nasconde le API keys** dal client (app mobile)
- **Rate limiting** per prevenire abusi
- **Caching** per ridurre costi API
- **CORS** configurabile per sicurezza
- **Health checks** per monitoring

## Quick Start

### Sviluppo Locale

```bash
# Installa dipendenze
npm install

# Crea file .env
cp .env.example .env

# Edita .env con le tue credenziali

# Avvia server
npm start

# Oppure con auto-reload
npm run dev
```

Il server sarà disponibile su `http://localhost:3000`

### Con Docker

```bash
# Build immagine
docker build -t nearbite-backend .

# Run container
docker run -p 3000:3000 \
  -e GOOGLE_PLACES_API_KEY=your_key \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_ANON_KEY=your_key \
  nearbite-backend
```

### Con Docker Compose

```bash
# Dalla root del progetto
docker-compose up
```

## Endpoints

### Health Check

```
GET /health
```

Risposta:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "nearbite-backend",
  "version": "1.0.0"
}
```

### Google Places API

#### Nearby Search
```
GET /api/places/nearby?latitude=45.4642&longitude=9.1900&radius=5000&type=restaurant&pagetoken=optional
```

#### Place Details
```
GET /api/places/details/:placeId?fields=optional
```

#### Photo URL
```
GET /api/places/photo/:photoReference?maxwidth=400
```

#### Autocomplete
```
GET /api/places/autocomplete?input=Milano&types=geocode
```

#### Geocoding
```
GET /api/places/geocode?address=Milano
```

## Configurazione

### Variabili d'Ambiente

```bash
# Server
PORT=3000                           # Porta server (default: 3000)

# API Keys
GOOGLE_PLACES_API_KEY=your_key      # Google Places API key
SUPABASE_URL=your_url               # Supabase project URL
SUPABASE_ANON_KEY=your_key          # Supabase anon key

# CORS
ALLOWED_ORIGINS=*                   # Origins permessi (separati da virgola)
                                    # Esempio: http://localhost:8081,http://192.168.1.100:8081
```

### Rate Limiting

Configurato in `src/middleware/rateLimiter.js`:

- **General**: 100 richieste per 15 minuti
- **API**: 50 richieste per 15 minuti

### Caching

- **TTL**: 2 minuti (120000ms)
- **Storage**: In-memory Map
- Cache automatica per tutte le chiamate API

## Sicurezza

### Headers di Sicurezza

Usa [helmet](https://helmetjs.github.io/) per aggiungere headers di sicurezza:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- E altri...

### Rate Limiting

Previene abusi limitando il numero di richieste per IP.

### CORS

Configurabile per permettere solo origin specifici in produzione.

## Monitoring

### Health Checks

```bash
# Manual check
curl http://localhost:3000/health

# Docker health check (automatico)
# Definito nel Dockerfile
```

### Logging

Il server usa [morgan](https://github.com/expressjs/morgan) per logging delle richieste in formato "combined" (Apache style).

## Performance

### Caching

Il backend implementa caching in-memory per:
- Nearby search
- Place details
- Autocomplete
- Geocoding

**Vantaggi**:
- Riduce chiamate API (costi ridotti)
- Risposta più veloce
- Migliore UX

### Rate Limiting

Protegge sia il backend che le API esterne da sovraccarico.

## Deployment

Vedi [DOCKER.md](../DOCKER.md) nella root del progetto per istruzioni dettagliate su:
- Deploy con Docker
- Deploy su Heroku
- Deploy su AWS ECS
- Deploy su Google Cloud Run

## Sviluppo

### Struttura

```
src/
├── controllers/
│   └── placesController.js    # Logica business per Places API
├── middleware/
│   └── rateLimiter.js         # Rate limiting middleware
├── routes/
│   └── places.js              # Route definitions
└── server.js                  # Entry point
```

### Aggiungere nuovi endpoint

1. Crea controller in `src/controllers/`
2. Crea route in `src/routes/`
3. Registra route in `src/server.js`

### Testing

```bash
# Test health check
curl http://localhost:3000/health

# Test nearby search
curl "http://localhost:3000/api/places/nearby?latitude=45.4642&longitude=9.1900&radius=5000"

# Test con rate limiting
# Fai più di 50 richieste in 15 minuti e verifica il 429 Too Many Requests
```

## Troubleshooting

### Port già in uso

```bash
# Trova processo sulla porta 3000
lsof -ti :3000

# Uccidi il processo
kill -9 $(lsof -ti :3000)
```

### API Keys non funzionanti

Verifica che le variabili d'ambiente siano configurate:

```bash
# Check env vars
node -e "console.log(process.env.GOOGLE_PLACES_API_KEY)"
```

### Errori CORS

Se l'app non riesce a connettersi:

1. Verifica `ALLOWED_ORIGINS` nel backend
2. Per sviluppo usa `ALLOWED_ORIGINS=*`
3. Per produzione specifica gli origin esatti

## Licenza

MIT
