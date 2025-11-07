# 🚀 Setup per il Team - NearBite

Guida rapida per i membri del team per usare il progetto NearBite.

## ✅ Tutto Pronto!

Il backend è già deployato su Railway con le API keys protette. Non dovrai configurare nulla!

## Setup Veloce (5 minuti)

### 1. Clona il Repository

```bash
git clone https://github.com/mariocelzo/resturant-finder.git
cd resturant-finder
```

### 2. Installa le Dipendenze

```bash
npm install
```

### 3. Configura il File .env

Crea un file `.env` nella root del progetto con questo contenuto:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://mrtfjejvllqawhkyhfcm.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ydGZqZWp2bGxxYXdoa3loZmNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjE2MTQsImV4cCI6MjA3MzUzNzYxNH0.VvKeLOM1cEIiqwPKK_ZRAcGMweuDGcE68iYSCBJ3Dxw

# Backend Proxy Railway (API keys protette)
EXPO_PUBLIC_USE_BACKEND_PROXY=true
EXPO_PUBLIC_BACKEND_URL=https://nearbite-backend-production.up.railway.app
```

**Nota**: Non serve la Google Places API key! Il backend Railway la gestisce per te.

### 4. Avvia il Progetto

```bash
npm start
```

Scegli la piattaforma:
- **iOS**: Premi `i` (richiede macOS e Xcode)
- **Android**: Premi `a` (richiede Android Studio)
- **Web**: Premi `w`

## 🔐 Sicurezza

- ✅ Le API keys Google sono **nascoste sul server Railway**
- ✅ Solo l'URL del backend è pubblico (nessuna key esposta)
- ✅ Il backend gestisce rate limiting e caching
- ✅ Non puoi vedere o estrarre le API keys dal codice

## 🌐 Come Funziona

```
App (tuo PC) → Railway Backend → Google Places API
                    ↓
              (API keys protette)
```

Il tuo device non chiama mai direttamente Google Places API. Tutte le richieste passano attraverso il backend Railway che:
1. Riceve la richiesta dall'app
2. Aggiunge le API keys server-side
3. Chiama Google Places API
4. Restituisce i risultati all'app

## 📱 Piattaforme Supportate

- **iOS**: iPhone e iPad (simulatore o device fisico)
- **Android**: Smartphone e tablet (emulatore o device fisico)
- **Web**: Qualsiasi browser moderno (responsive design)

## 🛠️ Comandi Utili

```bash
# Avvia il progetto
npm start

# Avvia solo iOS
npm run ios

# Avvia solo Android
npm run android

# Avvia solo Web
npm run web

# Pulisci la cache
npm start -- --clear
```

## 🗄️ Database (Supabase)

Il database è già configurato e condiviso. Include:
- Autenticazione utenti
- Preferiti ristoranti
- Recensioni utenti
- Profili utente
- Posizioni salvate

## ❓ Troubleshooting

### L'app non carica i ristoranti

Verifica che il file `.env` contenga:
```bash
EXPO_PUBLIC_USE_BACKEND_PROXY=true
EXPO_PUBLIC_BACKEND_URL=https://nearbite-backend-production.up.railway.app
```

### Errore "Network request failed"

1. Verifica la connessione internet
2. Controlla che il backend Railway sia online: https://nearbite-backend-production.up.railway.app/health
3. Riavvia l'app con `npm start -- --clear`

### Problemi con Expo

```bash
# Pulisci tutto e reinstalla
rm -rf node_modules
npm install
npm start -- --clear
```

## 📚 Documentazione Completa

- **Setup Generale**: [SETUP.md](./SETUP.md)
- **Backend Railway**: [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)
- **Docker (opzionale)**: [DOCKER.md](./DOCKER.md)
- **Architettura**: [CLAUDE.md](./CLAUDE.md)

## 🆘 Supporto

Se hai problemi, contatta Mario o apri una issue su GitHub.

---

**Happy Coding! 🎉**
