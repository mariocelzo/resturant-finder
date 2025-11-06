-- Tabella per tracciare le interazioni degli utenti con i ristoranti
-- Questa tabella alimenta il sistema di raccomandazioni personalizzate

CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  cuisine_type TEXT,
  price_level INTEGER CHECK (price_level >= 1 AND price_level <= 4),
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'favorite', 'unfavorite', 'review', 'search')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_place_id ON user_interactions(place_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_cuisine ON user_interactions(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_cuisine ON user_interactions(user_id, cuisine_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);

-- Row Level Security (RLS)
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono leggere solo le proprie interazioni
CREATE POLICY "Users can view own interactions"
  ON user_interactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Gli utenti possono inserire solo le proprie interazioni
CREATE POLICY "Users can insert own interactions"
  ON user_interactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Gli utenti possono aggiornare solo le proprie interazioni
CREATE POLICY "Users can update own interactions"
  ON user_interactions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Gli utenti possono eliminare solo le proprie interazioni
CREATE POLICY "Users can delete own interactions"
  ON user_interactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Commenti per documentazione
COMMENT ON TABLE user_interactions IS 'Traccia tutte le interazioni degli utenti con i ristoranti per il sistema di raccomandazioni';
COMMENT ON COLUMN user_interactions.interaction_type IS 'Tipo di interazione: view, favorite, unfavorite, review, search';
COMMENT ON COLUMN user_interactions.rating IS 'Rating dato dall''utente (solo per interaction_type=review)';
COMMENT ON COLUMN user_interactions.cuisine_type IS 'Tipo di cucina del ristorante per calcolare le preferenze';
COMMENT ON COLUMN user_interactions.price_level IS 'Livello di prezzo del ristorante (1-4)';
