# Docker Setup Guide - NearBite

Guida per utilizzare NearBite con Docker, permettendo ad altri di eseguire l'app senza configurare le proprie API keys.

## Architettura

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│             │      │                  │      │                 │
│  App React  │─────▶│  Backend Proxy   │─────▶│  Google Places  │
│   Native    │      │    (Docker)      │      │      API        │
│             │      │                  │      │                 │
└─────────────┘      └──────────────────┘      └─────────────────┘
                              │
                              │
                              ▼
                     ┌──────────────────┐
                     │                  │
                     │  Supabase Cloud  │
                     │   (Database)     │
                     │                  │
                     └──────────────────┘
```

**Come funziona:**
- Il **backend proxy** (Express.js) nasconde le API keys dal client
- Le API keys sono configurate **solo nel container Docker** (server-side)
- L'app React Native si connette al proxy invece di chiamare direttamente le API
- Il database Supabase rimane nel cloud (nessuna migrazione necessaria)

## Setup Rapido

### Prerequisiti

- Docker Desktop installato ([Download](https://www.docker.com/products/docker-desktop))
- Docker Compose (incluso in Docker Desktop)

### 1. Prepara le credenziali

Crea un file `.env` nella root del progetto con le tue credenziali:

```bash
# Copia il template
cp .env.docker .env

# Edita il file .env con le tue credenziali
# (Supabase URL, Supabase Anon Key, Google Places API Key)
```

**⚠️ IMPORTANTE**: Il file `.env` contiene le tue API keys e **NON deve essere committato** su git. È già nel `.gitignore`.

### 2. Avvia il backend con Docker

```bash
# Build e avvio del container
docker-compose up --build

# Oppure in background
docker-compose up -d --build
```

Il backend sarà disponibile su `http://localhost:3000`

### 3. Configura l'app per usare il proxy

Nel file `.env` dell'app (root del progetto), aggiungi:

```bash
# Abilita la modalità proxy
EXPO_PUBLIC_USE_BACKEND_PROXY=true

# URL del backend proxy
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
```

**Nota per dispositivi fisici**: Se testi su un dispositivo fisico (non simulatore), usa l'IP della tua macchina invece di `localhost`:

```bash
# Trova il tuo IP locale (su Mac):
ifconfig | grep "inet " | grep -v 127.0.0.1

# Esempio:
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:3000
```

### 4. Avvia l'app Expo

```bash
npm start
```

## Comandi Docker Utili

```bash
# Avvia i container
docker-compose up

# Avvia in background
docker-compose up -d

# Ferma i container
docker-compose down

# Visualizza log
docker-compose logs -f

# Rebuild dopo modifiche al codice
docker-compose up --build

# Rimuovi container e volumi
docker-compose down -v
```

## Testing del Backend

### Health Check

```bash
curl http://localhost:3000/health
```

Risposta attesa:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "nearbite-backend",
  "version": "1.0.0"
}
```

### Test ricerca ristoranti

```bash
# Cerca ristoranti vicino a Milano (esempio)
curl "http://localhost:3000/api/places/nearby?latitude=45.4642&longitude=9.1900&radius=5000"
```

## Distribuzione dell'Immagine Docker

Se vuoi condividere l'immagine Docker con altri senza esporre le API keys nel repository:

### Opzione 1: Docker Hub (pubblico)

```bash
# Build dell'immagine
docker build -t tuousername/nearbite-backend:latest ./backend

# Login a Docker Hub
docker login

# Push dell'immagine
docker push tuousername/nearbite-backend:latest
```

**⚠️ ATTENZIONE**: Le API keys saranno visibili nell'immagine! Usa questa opzione solo per demo con chiavi temporanee.

### Opzione 2: Registry Privato (raccomandato)

Usa un registry privato come:
- GitHub Container Registry (ghcr.io)
- AWS ECR
- Azure Container Registry
- Google Container Registry

#### Esempio con GitHub Container Registry:

```bash
# Build con tag GitHub
docker build -t ghcr.io/tuousername/nearbite-backend:latest ./backend

# Login a GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u tuousername --password-stdin

# Push
docker push ghcr.io/tuousername/nearbite-backend:latest
```

### Opzione 3: File .env esterno (raccomandato per produzione)

Invece di includere le API keys nell'immagine, passale tramite file `.env` o variabili d'ambiente:

```bash
# Gli utenti creano il loro .env locale
cp .env.docker .env
# Editano con le loro credenziali

# Avviano con docker-compose che legge il .env
docker-compose up
```

## Produzione

### Best Practices

1. **Non includere API keys nell'immagine Docker**
   - Usa variabili d'ambiente esterne
   - Usa secret management (Docker Secrets, Kubernetes Secrets, AWS Secrets Manager)

2. **Abilita HTTPS**
   - Usa un reverse proxy (nginx, Traefik)
   - Configura certificati SSL/TLS

3. **Rate Limiting**
   - Il backend già include rate limiting di base
   - Configura limiti appropriati per produzione

4. **Monitoring**
   - Aggiungi health checks
   - Usa Prometheus/Grafana per metriche
   - Log aggregation (ELK stack, CloudWatch)

5. **Scaling**
   - Usa orchestrator (Kubernetes, Docker Swarm, AWS ECS)
   - Load balancer per distribuire il traffico

### Deploy su Cloud

#### Deploy su Heroku

```bash
# Login
heroku login

# Crea app
heroku create nearbite-backend

# Imposta variabili d'ambiente
heroku config:set GOOGLE_PLACES_API_KEY=your_key_here
heroku config:set SUPABASE_URL=your_url_here
heroku config:set SUPABASE_ANON_KEY=your_key_here

# Deploy
git subtree push --prefix backend heroku main
```

#### Deploy su AWS ECS

Vedi documentazione AWS per configurare:
- ECR (registry per immagini)
- ECS (orchestrazione container)
- ALB (load balancer)
- Secrets Manager (API keys)

#### Deploy su Google Cloud Run

```bash
# Build e push
gcloud builds submit --tag gcr.io/PROJECT_ID/nearbite-backend ./backend

# Deploy
gcloud run deploy nearbite-backend \
  --image gcr.io/PROJECT_ID/nearbite-backend \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_PLACES_API_KEY=your_key_here,SUPABASE_URL=your_url_here,SUPABASE_ANON_KEY=your_key_here"
```

## Troubleshooting

### Backend non si avvia

```bash
# Verifica i log
docker-compose logs backend

# Verifica variabili d'ambiente
docker-compose exec backend env | grep API
```

### App non si connette al backend

1. Verifica che il backend sia in esecuzione:
   ```bash
   curl http://localhost:3000/health
   ```

2. Verifica le variabili d'ambiente dell'app:
   - `EXPO_PUBLIC_USE_BACKEND_PROXY=true`
   - `EXPO_PUBLIC_BACKEND_URL=http://localhost:3000`

3. Se usi un dispositivo fisico, usa l'IP della macchina invece di `localhost`

### Errore "CORS blocked"

Il backend già include configurazione CORS. Se hai problemi:

1. Verifica che `ALLOWED_ORIGINS` sia configurato correttamente nel backend
2. Per sviluppo, usa `ALLOWED_ORIGINS=*`
3. Per produzione, specifica gli origin esatti

### Rate Limiting

Se ricevi errori "Too many requests":

1. Il backend ha rate limiting per proteggere le API
2. Limiti di default:
   - 100 richieste/15min per endpoint generali
   - 50 richieste/15min per API esterne
3. Modifica i limiti in `backend/src/middleware/rateLimiter.js`

## Struttura File Backend

```
backend/
├── src/
│   ├── controllers/
│   │   └── placesController.js    # Logica per Google Places API
│   ├── middleware/
│   │   └── rateLimiter.js         # Rate limiting configuration
│   ├── routes/
│   │   └── places.js              # Route definitions
│   └── server.js                  # Entry point Express server
├── Dockerfile                     # Docker configuration
├── .dockerignore                  # Files da escludere dal build
├── package.json                   # Dependencies
└── .env.example                   # Template variabili d'ambiente
```

## Sicurezza

### Protezione API Keys

✅ **BENE**:
- API keys nel file `.env` (non committato)
- API keys come variabili d'ambiente Docker
- API keys in secret manager cloud

❌ **MALE**:
- API keys hardcoded nel codice
- API keys nell'immagine Docker
- API keys commitatte su git

### Rate Limiting

Il backend include rate limiting per prevenire abusi:
- Protegge le tue API keys da utilizzo eccessivo
- Previene attacchi DoS
- Configura limiti appropriati per il tuo use case

### CORS

Configurazione CORS del backend:
- Sviluppo: `ALLOWED_ORIGINS=*`
- Produzione: specifica domini esatti (es. `https://yourapp.com`)

## Costi

### Google Places API

- **Free tier**: $200 crediti/mese
- Dopo il free tier: ~$0.017 per richiesta nearby search
- Il caching nel backend riduce le chiamate API

### Supabase

- **Free tier**: 500MB database, 2GB bandwidth
- Dopo il free tier: piani a pagamento

### Hosting Backend

- **Docker locale**: Gratuito
- **Heroku**: Free tier disponibile (con limiti)
- **Google Cloud Run**: Pay-per-use (molto economico per traffico basso)
- **AWS ECS**: Pay-per-use

## Supporto

Per problemi o domande:
- Apri una issue nel repository
- Consulta la documentazione Expo
- Consulta la documentazione Docker

## Risorse

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Express.js Documentation](https://expressjs.com/)
- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
