-- Crea la tabella user_reviews per le recensioni dei ristoranti
-- Esegui questo script nella tua console Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.user_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id TEXT NOT NULL, -- Google Place ID
  restaurant_name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_user_reviews_place_id ON public.user_reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_user_id ON public.user_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_created_at ON public.user_reviews(created_at DESC);

-- RLS (Row Level Security) policies
ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Tutti possono leggere le recensioni
CREATE POLICY "Anyone can read reviews"
  ON public.user_reviews
  FOR SELECT
  USING (true);

-- Policy: Solo utenti autenticati possono inserire recensioni
CREATE POLICY "Authenticated users can insert reviews"
  ON public.user_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Gli utenti possono aggiornare solo le proprie recensioni
CREATE POLICY "Users can update own reviews"
  ON public.user_reviews
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Gli utenti possono cancellare solo le proprie recensioni
CREATE POLICY "Users can delete own reviews"
  ON public.user_reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_reviews_updated_at
  BEFORE UPDATE ON public.user_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Commento sulla tabella
COMMENT ON TABLE public.user_reviews IS 'Recensioni degli utenti per i ristoranti da Google Places';
