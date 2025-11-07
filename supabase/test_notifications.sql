-- ============================================
-- Script per Testare le Notifiche
-- ============================================
-- 
-- ISTRUZIONI:
-- 1. Sostituisci 'YOUR_USER_ID_HERE' con il tuo vero user_id
-- 2. Per trovare il tuo user_id, vai su:
--    Supabase Dashboard > Authentication > Users
--    Copia l'UUID del tuo utente
-- 3. Esegui questo script nell'SQL Editor di Supabase
--
-- ============================================

-- Sostituisci questo con il tuo user_id vero!
-- Esempio: '123e4567-e89b-12d3-a456-426614174000'
DO $$
DECLARE
  target_user_id UUID := 'YOUR_USER_ID_HERE';
BEGIN
  
  -- Inserisci notifiche di test
  INSERT INTO notifications (user_id, type, title, message, read, created_at)
  VALUES 
    -- Notifica di sistema (benvenuto)
    (target_user_id, 'system', '🎉 Benvenuto su Restaurant Finder!', 
     'Grazie per esserti registrato. Inizia a esplorare i migliori ristoranti vicino a te!', 
     false, NOW() - INTERVAL '2 hours'),
    
    -- Notifica raccomandazione
    (target_user_id, 'recommendation', '🎯 Abbiamo un suggerimento per te', 
     'Basandoci sui tuoi gusti, pensiamo che "Trattoria Da Mario" potrebbe piacerti. Provalo!', 
     false, NOW() - INTERVAL '1 hour'),
    
    -- Notifica aggiornamento preferiti
    (target_user_id, 'favorite_update', '❤️ Novità nei tuoi preferiti', 
     'Il ristorante "Pizzeria Napoli" che hai salvato nei preferiti ha ricevuto 5 nuove recensioni positive!', 
     false, NOW() - INTERVAL '30 minutes'),
    
    -- Notifica risposta recensione
    (target_user_id, 'review_reply', '💬 Risposta alla tua recensione', 
     'Il proprietario di "Sushi Bar Tokyo" ha risposto alla tua recensione. Leggi cosa ha scritto!', 
     false, NOW() - INTERVAL '15 minutes'),
    
    -- Notifica già letta (per testare il filtro)
    (target_user_id, 'system', '✅ Profilo completato', 
     'Hai completato il tuo profilo al 100%! Ottimo lavoro!', 
     true, NOW() - INTERVAL '3 days'),
    
    -- Notifica raccomandazione con data nel JSONB
    (target_user_id, 'recommendation', '🔥 Ristorante di tendenza', 
     'Molti utenti nella tua zona hanno apprezzato "Osteria del Mare". Dai un''occhiata!', 
     false, NOW() - INTERVAL '10 minutes');

  RAISE NOTICE 'Notifiche di test inserite con successo per user_id: %', target_user_id;

END $$;

-- Verifica le notifiche inserite
-- SELECT * FROM notifications WHERE user_id = 'YOUR_USER_ID_HERE' ORDER BY created_at DESC;

-- Query per contare le notifiche non lette
-- SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = 'YOUR_USER_ID_HERE' AND read = false;

-- Query per eliminare tutte le notifiche di test (se necessario)
-- DELETE FROM notifications WHERE user_id = 'YOUR_USER_ID_HERE';
