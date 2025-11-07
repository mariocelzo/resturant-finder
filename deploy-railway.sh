#!/bin/bash

# Script per deploy del backend NearBite su Railway
# Esegui questo script dal terminale: bash deploy-railway.sh

echo "🚂 ========================================"
echo "🚂  NearBite Backend - Deploy su Railway"
echo "🚂 ========================================"
echo ""

# Vai nella root del progetto
echo "📁 Posizione: $(pwd)"
echo ""

# Vai nella cartella backend
cd backend || { echo "❌ Errore: cartella backend non trovata"; exit 1; }

echo "📁 Posizione backend: $(pwd)"
echo ""

# Inizializza Railway (usa npx per installazione locale)
echo "🔧 Inizializzando progetto Railway..."
npx railway init

echo ""
echo "🚀 Facendo deploy del backend..."
npx railway up

echo ""
echo "🔐 Configurando variabili d'ambiente..."
echo ""
echo "⚠️  IMPORTANTE: Ora devi aggiungere le variabili d'ambiente:"
echo ""
echo "Leggi il file .env locale per le tue credenziali:"
cat .env
echo ""
echo "Ora copia le variabili d'ambiente con questi comandi (esegui dalla cartella backend):"
echo ""
echo "cd backend"
echo "npx railway variables set GOOGLE_PLACES_API_KEY=<tua_api_key>"
echo "npx railway variables set SUPABASE_URL=<tuo_supabase_url>"
echo "npx railway variables set SUPABASE_ANON_KEY=<tuo_supabase_anon_key>"
echo "npx railway variables set PORT=3000"
echo "npx railway variables set ALLOWED_ORIGINS=*"
echo ""
echo "✅ Una volta configurate le variabili, il backend sarà online!"
echo ""
echo "Per ottenere l'URL del backend:"
echo "npx railway domain"
echo ""
echo "Poi aggiorna il file .env nella root del progetto con:"
echo "EXPO_PUBLIC_USE_BACKEND_PROXY=true"
echo "EXPO_PUBLIC_BACKEND_URL=<url_railway>"
