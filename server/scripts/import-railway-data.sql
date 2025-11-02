-- ============================================
-- IMPORT DATI IN RAILWAY
-- ============================================
-- IMPORTANTE: Sostituisci i valori INSERT con quelli esportati da Supabase
-- Mantieni l'ordine delle tabelle per rispettare le foreign keys
-- ============================================

-- Disabilita temporaneamente foreign keys
SET session_replication_role = 'replica';

-- 1. INSERT CONGREGAZIONI
-- Copia qui i risultati della query export congregazioni
-- Formato:
INSERT INTO congregazioni (id, codice, nome, created_at, updated_at)
VALUES 
  (1, '001', 'Palermo Uditore', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
  -- Aggiungi tutte le altre righe qui
ON CONFLICT (id) DO NOTHING;

-- 2. INSERT VOLONTARI
-- Copia qui i risultati della query export volontari
INSERT INTO volontari (id, congregazione_id, nome, cognome, sesso, stato, ultima_assegnazione, email, telefono, password_hash, ruolo, created_at, updated_at)
VALUES 
  -- Copia qui i dati esportati
ON CONFLICT (id) DO NOTHING;

-- 3. INSERT POSTAZIONI
-- Copia qui i risultati della query export postazioni
INSERT INTO postazioni (id, congregazione_id, luogo, indirizzo, giorni_settimana, stato, max_proclamatori, created_at, updated_at)
VALUES 
  -- Copia qui i dati esportati
ON CONFLICT (id) DO NOTHING;

-- 4. INSERT SLOT_ORARI
-- Copia qui i risultati della query export slot_orari
INSERT INTO slot_orari (id, postazione_id, congregazione_id, orario_inizio, orario_fine, max_volontari, stato, created_at, updated_at)
VALUES 
  -- Copia qui i dati esportati
ON CONFLICT (id) DO NOTHING;

-- 5. INSERT DISPONIBILITA
-- Copia qui i risultati della query export disponibilita
INSERT INTO disponibilita (id, volontario_id, congregazione_id, data, stato, note, created_at, slot_orario_id)
VALUES 
  -- Copia qui i dati esportati
ON CONFLICT (id) DO NOTHING;

-- 6. INSERT ASSEGNAZIONI
-- Copia qui i risultati della query export assegnazioni
INSERT INTO assegnazioni (id, postazione_id, congregazione_id, slot_orario_id, data_turno, stato, note, created_at, updated_at)
VALUES 
  -- Copia qui i dati esportati
ON CONFLICT (id) DO NOTHING;

-- 7. INSERT ASSEGNAZIONI_VOLONTARI
-- Copia qui i risultati della query export assegnazioni_volontari
INSERT INTO assegnazioni_volontari (id, assegnazione_id, volontario_id, congregazione_id, ruolo_turno, created_at)
VALUES 
  -- Copia qui i dati esportati
ON CONFLICT (id) DO NOTHING;

-- 8. INSERT NOTIFICHE (se esiste)
-- INSERT INTO notifiche ...
-- ON CONFLICT (id) DO NOTHING;

-- 9. INSERT NOTIFICATIONS (se esiste)
-- INSERT INTO notifications ...
-- ON CONFLICT (id) DO NOTHING;

-- Riabilita foreign keys
SET session_replication_role = 'origin';

-- Verifica import
SELECT 'congregazioni' as tabella, COUNT(*) as record FROM congregazioni
UNION ALL
SELECT 'volontari', COUNT(*) FROM volontari
UNION ALL
SELECT 'postazioni', COUNT(*) FROM postazioni
UNION ALL
SELECT 'slot_orari', COUNT(*) FROM slot_orari
UNION ALL
SELECT 'disponibilita', COUNT(*) FROM disponibilita
UNION ALL
SELECT 'assegnazioni', COUNT(*) FROM assegnazioni
UNION ALL
SELECT 'assegnazioni_volontari', COUNT(*) FROM assegnazioni_volontari;

