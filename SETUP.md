# Setup Guide - NearBite

Guida per configurare il progetto NearBite sul tuo ambiente di sviluppo.

## Prerequisiti

- Node.js (versione 18 o superiore)
- npm o yarn
- Expo CLI
- Xcode (per iOS) o Android Studio (per Android)
- Account Supabase (gratuito)
- Account Google Cloud Platform (gratuito)

## Installazione

### 1. Clona il repository

```bash
git clone <url-del-repository>
cd resturant-finder
```

### 2. Installa le dipendenze

```bash
npm install
```

### 3. Configura le variabili d'ambiente

Crea un file `.env` nella root del progetto copiando il template:

```bash
cp .env.example .env
```

Ora apri il file `.env` e configura le tue credenziali:

#### Configurazione Supabase

1. Vai su [https://app.supabase.com](https://app.supabase.com)
2. Crea un nuovo progetto (o usa uno esistente)
3. Vai su Settings → API
4. Copia:
   - `Project URL` → inseriscilo in `EXPO_PUBLIC_SUPABASE_URL`
   - `anon public` key → inseriscilo in `EXPO_PUBLIC_SUPABASE_ANON_KEY`

#### Schema Database Supabase

Esegui questi comandi SQL nel tuo progetto Supabase (SQL Editor):

```sql
-- Tabella user_profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella saved_locations
CREATE TABLE saved_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella favorites
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  latitude REAL,
  longitude REAL,
  rating REAL,
  price_level INTEGER,
  cuisine_type TEXT,
  photo_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, place_id)
);

-- Tabella user_reviews
CREATE TABLE user_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  cuisine_type TEXT,
  price_level INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abilita Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;

-- Policy per user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy per saved_locations
CREATE POLICY "Users can view own locations" ON saved_locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own locations" ON saved_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own locations" ON saved_locations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own locations" ON saved_locations FOR DELETE USING (auth.uid() = user_id);

-- Policy per favorites
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- Policy per user_reviews
CREATE POLICY "Anyone can view reviews" ON user_reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON user_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON user_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON user_reviews FOR DELETE USING (auth.uid() = user_id);
```

#### Configurazione Google Places API

1. Vai su [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuovo progetto (o usa uno esistente)
3. Abilita queste API:
   - Places API
   - Maps JavaScript API
   - Geocoding API
4. Vai su "Credenziali" → "Crea credenziali" → "Chiave API"
5. Copia la chiave API → inseriscila in `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`

**Importante**: Configura le restrizioni sulla chiave API per sicurezza:
- Vai su "Modifica chiave API"
- In "Restrizioni applicazione", seleziona "App iOS" o "App Android" e aggiungi i bundle ID/package name
- In "Restrizioni API", seleziona solo le API necessarie

### 4. Avvia il progetto

#### iOS (richiede macOS con Xcode)

```bash
npm run ios
```

#### Android (richiede Android Studio)

```bash
npm run android
```

#### Web

```bash
npm run web
```

#### Sviluppo generale (scegli piattaforma dal QR code)

```bash
npm start
```

## Modalità Guest

L'app supporta una modalità guest che permette di utilizzare l'app senza registrazione:
- I favoriti vengono salvati in AsyncStorage locale
- Non è possibile scrivere recensioni
- I dati non vengono sincronizzati tra dispositivi

## Troubleshooting

### Errore "Could not connect to server"

- Assicurati che Metro Bundler sia completamente avviato
- Prova a pulire la cache: `npx expo start --clear`
- Verifica che le variabili d'ambiente siano configurate correttamente

### Errore API Google Places

- Verifica che la chiave API sia valida
- Controlla che le API necessarie siano abilitate nel progetto Google Cloud
- Verifica le restrizioni sulla chiave API

### Errore Supabase

- Verifica URL e chiave API in `.env`
- Controlla che le tabelle siano state create correttamente
- Verifica che le policy RLS siano configurate

### Metro Bundler bloccato

```bash
# Uccidi tutti i processi sulla porta 8081
lsof -ti :8081 | xargs kill -9

# Riavvia Expo
npm start
```

## Struttura del Progetto

```
/src
  /components  - Componenti React riutilizzabili
  /contexts    - Context API (Auth, Location, Theme)
  /screens     - Schermate dell'app
  /services    - Servizi per API (Supabase, Google Places)
  /hooks       - Custom React hooks
```

## Documentazione Aggiuntiva

- [CLAUDE.md](./CLAUDE.md) - Guida per Claude Code AI
- [AGENTS.md](./AGENTS.md) - Convenzioni per AI agents
- [README.md](./README.md) - Documentazione generale del progetto

## Supporto

Per problemi o domande, apri una issue nel repository.
