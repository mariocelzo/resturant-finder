# Supabase Setup - User Reviews Table

## Problema
L'app sta cercando di accedere alla tabella `public.user_reviews` che non esiste nel database Supabase.

## Soluzione

### 1. Accedi alla Dashboard Supabase
1. Vai su [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Seleziona il tuo progetto
3. Vai su **SQL Editor** nel menu laterale

### 2. Esegui la Migrazione
1. Apri il file `supabase_migration_user_reviews.sql`
2. Copia tutto il contenuto del file
3. Incollalo nell'editor SQL di Supabase
4. Clicca su **Run** (o premi `Ctrl/Cmd + Enter`)

### 3. Verifica
Dopo aver eseguito la migrazione, verifica che la tabella sia stata creata:
1. Vai su **Table Editor** nel menu laterale
2. Dovresti vedere la tabella `user_reviews` nell'elenco

## Struttura della Tabella

La tabella `user_reviews` contiene:
- `id` - UUID (chiave primaria)
- `place_id` - TEXT (Google Place ID)
- `restaurant_name` - TEXT
- `user_id` - UUID (riferimento a auth.users)
- `rating` - INTEGER (1-5)
- `text` - TEXT
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

## Politiche RLS (Row Level Security)

Le seguenti politiche sono attive:
- ✅ **Tutti possono leggere** le recensioni
- ✅ **Solo utenti autenticati** possono inserire recensioni
- ✅ **Gli utenti possono aggiornare** solo le proprie recensioni
- ✅ **Gli utenti possono cancellare** solo le proprie recensioni

## Test
Dopo la migrazione, l'errore:
```
❌ Supabase listForPlace error {"code": "PGRST205", "details": null, "hint": "Perhaps you meant the table 'public.user_profiles'", "message": "Could not find the table 'public.user_reviews' in the schema cache"}
```
dovrebbe scomparire e le recensioni dovrebbero funzionare correttamente.
