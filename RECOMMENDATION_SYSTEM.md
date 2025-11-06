# Sistema di Raccomandazioni Intelligenti 🤖

## Panoramica

NearBite implementa un sistema di raccomandazioni personalizzate simile a TikTok che impara dalle tue interazioni e preferenze per suggerirti i ristoranti che potrebbero piacerti di più.

## Come Funziona

### Tipi di Interazioni Tracciate

Il sistema traccia 5 tipi di interazioni, ognuno con un peso diverso:

1. **VIEW** (Peso: 1) - Visualizzazione del dettaglio ristorante
2. **FAVORITE** (Peso: 5) - Aggiunta ai preferiti
3. **UNFAVORITE** (Peso: -3) - Rimozione dai preferiti
4. **REVIEW** (Peso: 10-14) - Recensione scritta (bonus/malus in base al rating)
5. **SEARCH** (Peso: 0.5) - Ricerca per tipo di cucina

### Algoritmo di Raccomandazione

L'algoritmo calcola un punteggio personalizzato per ogni ristorante basandosi su:

1. **Preferenze per tipo di cucina** (max 10 punti)
   - Analizza le tue interazioni passate
   - Dà maggior peso ai tuoi top 3 tipi di cucina preferiti
   - Normalizza i punteggi per evitare bias

2. **Rating generale del ristorante** (max 5 punti)
   - Mantiene un livello base di qualità
   - Evita di raccomandare ristoranti scadenti

3. **Livello di prezzo** (±0.5 punti per livello)
   - Impara la tua fascia di prezzo preferita
   - Piccolo malus se il prezzo si discosta troppo

4. **Mix Factor** (70% personalizzazione, 30% qualità generale)
   - Bilanciamento tra preferenze personali ed esplorazione
   - Evita di creare una "bolla" limitata
   - Aggiunge casualità del 10% per varietà

### Esempi Pratici

**Scenario 1: Fan del Sushi**
```
Interazioni:
- 5 visualizzazioni ristoranti sushi
- 2 preferiti sushi
- 1 recensione 5 stelle sushi

Risultato:
✨ Il sistema mostrerà più ristoranti sushi in Home
✨ I ristoranti sushi appariranno più in alto nella lista
✨ Verranno comunque mostrati altri tipi per varietà
```

**Scenario 2: Budget-Conscious**
```
Interazioni:
- Preferiti principalmente fascia €/€€
- Review negative su ristoranti €€€€

Risultato:
✨ Priorità a ristoranti economici
✨ Ridotta visibilità ristoranti costosi
✨ Occasionalmente suggerimenti fascia media
```

## Integrazione nell'App

### Home Screen
- Lista principale ordinata per raccomandazioni personalizzate
- Header cambia da "🔥 Migliori ristoranti" a "✨ Consigliati per te"
- Sottotitolo: "In base alle tue preferenze e interazioni"

### Tracking Automatico
- **Apertura Dettaglio**: Tracciato automaticamente quando apri un ristorante
- **Preferiti**: Tracciato quando aggiungi/rimuovi dai preferiti
- **Recensioni**: Tracciato quando pubblichi una recensione

## Persistenza Dati

### Utenti Autenticati
- Dati salvati in Supabase nella tabella `user_interactions`
- Sincronizzato tra dispositivi
- Storico completo delle interazioni

### Utenti Guest
- Dati salvati in AsyncStorage locale
- Limitato alle ultime 100 interazioni
- Persi se si cancella l'app

## Privacy

- ✅ Tutti i dati sono personali e privati
- ✅ RLS (Row Level Security) attivo su Supabase
- ✅ Nessuna condivisione dati tra utenti
- ✅ Solo l'utente può vedere le proprie interazioni

## Configurazione Avanzata

### Modificare il Mix Factor

In `HomeScreen.tsx:59-64`:
```typescript
const sorted = await RecommendationService.sortByRecommendation(
  user.id,
  data,
  user.isGuest,
  0.7 // <-- Modifica questo valore (0-1)
);
```

- **0.0**: Solo qualità generale (nessuna personalizzazione)
- **0.5**: Bilanciamento 50/50
- **0.7**: Raccomandato (70% personalizzazione)
- **1.0**: Solo preferenze personali (massima personalizzazione)

### Modificare i Pesi

In `recommendationService.ts:42-48`:
```typescript
const DEFAULT_WEIGHTS: RecommendationWeights = {
  view: 1,       // Visualizzazione
  favorite: 5,   // Preferito
  unfavorite: -3,// Rimosso
  review: 10,    // Recensione base
  search: 0.5,   // Ricerca
};
```

## Database Schema

### Tabella `user_interactions`

```sql
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  place_id TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  cuisine_type TEXT,
  price_level INTEGER CHECK (1-4),
  interaction_type TEXT CHECK ('view', 'favorite', 'unfavorite', 'review', 'search'),
  rating INTEGER CHECK (1-5),
  created_at TIMESTAMP WITH TIME ZONE
);
```

### Indici per Performance

- `idx_user_interactions_user_id`
- `idx_user_interactions_place_id`
- `idx_user_interactions_cuisine`
- `idx_user_interactions_user_cuisine`
- `idx_user_interactions_created_at`

## API del Servizio

### `trackInteraction()`
Traccia una nuova interazione utente.

```typescript
await RecommendationService.trackInteraction(
  userId,
  placeId,
  restaurantName,
  InteractionType.VIEW,
  {
    cuisineType: 'Pizzeria',
    priceLevel: 2,
    isGuest: false
  }
);
```

### `getCuisinePreferences()`
Ottiene le preferenze di cucina dell'utente.

```typescript
const preferences = await RecommendationService.getCuisinePreferences(
  userId,
  isGuest
);
// Ritorna: [{ cuisine_type: 'Sushi', score: 45, interaction_count: 12, last_interaction: '...' }]
```

### `sortByRecommendation()`
Ordina una lista di ristoranti per raccomandazione.

```typescript
const sorted = await RecommendationService.sortByRecommendation(
  userId,
  restaurants,
  isGuest,
  0.7 // mixFactor
);
```

### `getUserPreferenceStats()`
Statistiche complete sulle preferenze utente.

```typescript
const stats = await RecommendationService.getUserPreferenceStats(
  userId,
  isGuest
);
// Ritorna: { totalInteractions, topCuisines, averagePrice, favoriteCount, reviewCount }
```

## Migrazione Database

Per creare la tabella in Supabase:

```bash
# Esegui lo script SQL in Supabase Dashboard > SQL Editor
cat supabase/migrations/create_user_interactions_table.sql
```

Oppure usa la Supabase CLI:

```bash
supabase db push
```

## Testing

### Test Manuale

1. Apri l'app come utente autenticato
2. Visualizza diversi ristoranti dello stesso tipo (es. Pizzeria)
3. Aggiungi alcuni ai preferiti
4. Scrivi recensioni
5. Torna alla Home e osserva i cambiamenti nell'ordine

### Verifica Dati

```sql
-- Visualizza tutte le interazioni
SELECT * FROM user_interactions
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;

-- Top 5 cucine preferite
SELECT
  cuisine_type,
  COUNT(*) as interactions,
  AVG(CASE
    WHEN interaction_type = 'favorite' THEN 5
    WHEN interaction_type = 'view' THEN 1
    WHEN interaction_type = 'review' THEN 10
    ELSE 0
  END) as avg_score
FROM user_interactions
WHERE user_id = 'YOUR_USER_ID'
GROUP BY cuisine_type
ORDER BY interactions DESC, avg_score DESC
LIMIT 5;
```

## Limitazioni Attuali

- Massimo 200 interazioni considerate per il calcolo
- Guest users limitati a 100 interazioni
- Nessun machine learning avanzato (algoritmo deterministico)
- Non considera fattori temporali (stagionalità, orari)

## Possibili Miglioramenti Futuri

1. **Collaborative Filtering**: Raccomandazioni basate su utenti simili
2. **Time Decay**: Dare più peso alle interazioni recenti
3. **Location-Based**: Considerare la distanza percorsa
4. **Contextual**: Ora del giorno, giorno della settimana
5. **A/B Testing**: Testare diversi algoritmi
6. **Feedback Loop**: Chiedere feedback sulle raccomandazioni

## Supporto

Per domande o problemi, consulta la documentazione o apri una issue su GitHub.
