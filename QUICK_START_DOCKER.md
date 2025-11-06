# Quick Start - Docker Setup

Guida rapida per avviare NearBite con Docker in 5 minuti.

## 🚀 Setup in 3 passi

### 1️⃣ Configura le credenziali

```bash
# Copia il template
cp .env.docker .env

# Edita .env con le tue credenziali (apri con il tuo editor)
# Inserisci:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - GOOGLE_PLACES_API_KEY
```

### 2️⃣ Avvia il backend con Docker

```bash
# Build e avvio (la prima volta ci vogliono 2-3 minuti)
docker-compose up --build

# Il backend sarà pronto quando vedi:
# 🚀  Server in ascolto su porta 3000
```

### 3️⃣ Configura l'app per usare il proxy

Nel file `.env` della root del progetto (NON `.env.docker`), aggiungi:

```bash
# Abilita modalità proxy
EXPO_PUBLIC_USE_BACKEND_PROXY=true
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
```

**💡 Nota**: Se testi su un dispositivo fisico (non simulatore), trova il tuo IP:

```bash
# Su Mac/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Esempio output: inet 192.168.1.100
# Usa questo IP nel .env:
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:3000
```

### 4️⃣ Avvia l'app

```bash
# In una nuova finestra del terminale
npm start

# Poi premi 'i' per iOS o 'a' per Android
```

## ✅ Verifica che funzioni

### Test backend

```bash
# Health check (deve rispondere con status: "OK")
curl http://localhost:3000/health

# Test ricerca ristoranti (esempio Milano)
curl "http://localhost:3000/api/places/nearby?latitude=45.4642&longitude=9.1900&radius=5000"
```

### Log del backend

Vedrai log come questi:
```
🌐 Chiamata API Google Places - Nearby Search
📦 Cache hit: nearby_45.4642_9.1900_5000_page1
✅ Totale aggregato 20 ristoranti
```

## 🛑 Stop e cleanup

```bash
# Ferma il backend
docker-compose down

# Rimuovi anche i volumi (opzionale)
docker-compose down -v
```

## 🔧 Troubleshooting

### Backend non si avvia

```bash
# Verifica i log
docker-compose logs backend

# Verifica che la porta 3000 sia libera
lsof -ti :3000
# Se c'è un processo, uccidilo:
kill -9 $(lsof -ti :3000)
```

### App non si connette al backend

1. **Verifica che il backend sia attivo:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Verifica le variabili d'ambiente dell'app:**
   - `EXPO_PUBLIC_USE_BACKEND_PROXY=true`
   - `EXPO_PUBLIC_BACKEND_URL=http://localhost:3000` (o il tuo IP)

3. **Riavvia Expo con cache pulita:**
   ```bash
   npx expo start --clear
   ```

### Errore "Could not connect"

- Se usi un **simulatore iOS/Android**: usa `http://localhost:3000`
- Se usi un **dispositivo fisico**: usa l'IP della tua macchina (es. `http://192.168.1.100:3000`)

## 📚 Documentazione completa

Per informazioni dettagliate su:
- Deploy in produzione
- Configurazione avanzata
- Sicurezza e best practices

Consulta [DOCKER.md](./DOCKER.md)

## 🎯 Come funziona

```
┌─────────────┐           ┌──────────────────┐           ┌─────────────┐
│             │  Richiesta │                  │ Richiesta │             │
│  App Expo   │─────────▶ │  Backend Docker  │─────────▶ │   Google    │
│   Mobile    │           │   (porta 3000)   │           │  Places API │
│             │ ◀─────────│   [API keys]     │◀──────────│             │
└─────────────┘  Risposta └──────────────────┘  Risposta └─────────────┘
                                  │
                                  │ Connessione diretta
                                  ▼
                          ┌──────────────────┐
                          │                  │
                          │  Supabase Cloud  │
                          │   (Database)     │
                          │                  │
                          └──────────────────┘
```

**Vantaggi:**
- ✅ Le tue API keys sono protette (solo nel container Docker)
- ✅ Rate limiting automatico per prevenire abusi
- ✅ Caching per ridurre costi API
- ✅ Altri possono usare l'app senza configurare API keys

## 🔐 Sicurezza

**⚠️ IMPORTANTE**: Non committare mai il file `.env` su git!

Il file `.env` è già nel `.gitignore`, quindi è al sicuro. Ma se condividi l'immagine Docker:

1. **Opzione A - Env esterni (raccomandato)**:
   - Condividi solo `docker-compose.yml`
   - Gli utenti creano il proprio `.env`

2. **Opzione B - Registry privato**:
   - Usa GitHub Container Registry o AWS ECR
   - L'immagine include le keys ma è privata

3. **Opzione C - Secrets management**:
   - Usa Docker Secrets, AWS Secrets Manager, ecc.
   - Le keys non sono mai nell'immagine

## 🎉 Pronto!

Ora puoi condividere il progetto! Gli altri dovranno solo:

1. Clonare il repo
2. Creare il file `.env` con le loro credenziali
3. `docker-compose up`
4. `npm start`

E l'app funziona! 🚀
