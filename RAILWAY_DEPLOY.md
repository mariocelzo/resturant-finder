# 🚂 Deploy Backend su Railway

Guida rapida per deployare il backend NearBite su Railway e proteggere le API keys.

## Prerequisiti

- ✅ Railway CLI installata (`npm install -g @railway/cli` o `npm install @railway/cli` locale)
- ✅ Account Railway (sign up gratis con GitHub su [railway.app](https://railway.app))
- ✅ Railway CLI autenticata (`npx railway login`)

**Nota**: Se hai installato Railway localmente nel progetto, usa sempre `npx railway` invece di solo `railway`.

## Metodo 1: Script Automatico (Consigliato)

Esegui semplicemente lo script dal terminale:

```bash
bash deploy-railway.sh
```

Lo script farà:
1. Inizializzerà il progetto Railway
2. Farà il deploy del backend
3. Ti mostrerà i comandi per configurare le variabili d'ambiente

## Metodo 2: Manuale via CLI

### Step 1: Inizializza Railway

```bash
cd backend
npx railway init
```

Ti chiederà di:
- Selezionare un progetto esistente o crearne uno nuovo
- Dare un nome al progetto (es. "nearbite-backend")

### Step 2: Deploy

```bash
npx railway up
```

Questo farà il build e il deploy del backend.

### Step 3: Configura Variabili d'Ambiente

Leggi le tue credenziali dal file `.env`:

```bash
cat .env
```

Poi configurale su Railway:

```bash
npx railway variables set GOOGLE_PLACES_API_KEY=AIzaSy...
npx railway variables set SUPABASE_URL=https://mrtfjejvllqawhkyhfcm.supabase.co
npx railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
npx railway variables set PORT=3000
npx railway variables set ALLOWED_ORIGINS=*
```

### Step 4: Genera Dominio Pubblico

```bash
npx railway domain
```

Questo genererà un URL pubblico tipo: `https://nearbite-backend-production.up.railway.app`

### Step 5: Verifica Deployment

Testa l'health check:

```bash
curl https://nearbite-backend-production.up.railway.app/health
```

Dovresti vedere:
```json
{
  "status": "OK",
  "timestamp": "2025-11-06T...",
  "service": "nearbite-backend",
  "version": "1.0.0"
}
```

## Configurazione App per usare Railway

Una volta che il backend è online, aggiorna il file `.env` nella root del progetto:

```bash
# Nel file .env root (NON backend/.env)
EXPO_PUBLIC_USE_BACKEND_PROXY=true
EXPO_PUBLIC_BACKEND_URL=https://nearbite-backend-production.up.railway.app
```

Poi riavvia l'app:

```bash
npm start
```

## Per il Tuo Team

I tuoi compagni di progetto dovranno solo:

1. Clonare il repository:
```bash
git clone https://github.com/mariocelzo/resturant-finder.git
cd resturant-finder
```

2. Installare dipendenze:
```bash
npm install
```

3. Creare `.env` con l'URL del tuo backend Railway:
```bash
# .env
EXPO_PUBLIC_USE_BACKEND_PROXY=true
EXPO_PUBLIC_BACKEND_URL=https://nearbite-backend-production.up.railway.app
EXPO_PUBLIC_SUPABASE_URL=https://mrtfjejvllqawhkyhfcm.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ... (la key pubblica Supabase)
```

4. Avviare l'app:
```bash
npm start
```

✅ **Le API keys Google restano NASCOSTE sul server Railway!**

## Comandi Utili Railway

```bash
# Vedere i log in tempo reale
npx railway logs

# Vedere le variabili d'ambiente configurate
npx railway variables

# Rideployare dopo modifiche
npx railway up --detach

# Aprire la dashboard web del progetto
npx railway open

# Vedere lo stato del deployment
npx railway status
```

## Costi

Railway offre:
- **$5/mese gratis** (500 ore di runtime)
- Sufficiente per sviluppo e testing
- Se superi: $0.000463/GB-hr memoria + $0.000231/vCPU-hr

Per un backend Node.js leggero: ~$1-2/mese oltre il piano gratuito.

## Troubleshooting

### Build fallisce
```bash
cd backend
npx railway logs
```
Controlla gli errori e verifica che `package.json` sia corretto.

### Backend non risponde
1. Verifica le variabili d'ambiente: `npx railway variables`
2. Controlla i log: `npx railway logs`
3. Verifica il dominio: `npx railway domain`

### Modifiche non si applicano
```bash
cd backend
npx railway up --detach
```

## Alternative a Railway

Se preferisci altre piattaforme:
- **Heroku**: Simile a Railway, $7/mese
- **Render**: Free tier 750 ore/mese
- **Fly.io**: Free tier 3 VM shared CPU
- **AWS ECS/Fargate**: Più complesso ma scalabile

Vedi [DOCKER.md](./DOCKER.md) per deploy con Docker su queste piattaforme.
