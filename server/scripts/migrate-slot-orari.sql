-- Script di migrazione per aggiungere la tabella slot_orari
-- Esegui questo script per aggiornare il database esistente

-- 1. Crea la nuova tabella slot_orari
CREATE TABLE IF NOT EXISTS slot_orari (
    id SERIAL PRIMARY KEY,
    postazione_id INTEGER REFERENCES postazioni(id) ON DELETE CASCADE,
    orario_inizio TIME NOT NULL,
    orario_fine TIME NOT NULL,
    max_volontari INTEGER DEFAULT 3,
    stato VARCHAR(20) DEFAULT 'attivo' CHECK (stato IN ('attivo', 'inattivo')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(postazione_id, orario_inizio, orario_fine)
);

-- 2. Aggiungi l'indice per ottimizzare le query
CREATE INDEX IF NOT EXISTS idx_slot_orari_postazione ON slot_orari(postazione_id);

-- 3. Aggiungi il trigger per updated_at
CREATE TRIGGER update_slot_orari_updated_at BEFORE UPDATE ON slot_orari
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Migra i dati esistenti dalle postazioni agli slot orari
INSERT INTO slot_orari (postazione_id, orario_inizio, orario_fine, max_volontari, stato)
SELECT 
    id as postazione_id,
    orario_inizio,
    orario_fine,
    3 as max_volontari,
    'attivo' as stato
FROM postazioni
WHERE orario_inizio IS NOT NULL AND orario_fine IS NOT NULL;

-- 5. Aggiungi la colonna slot_orario_id alla tabella assegnazioni
ALTER TABLE assegnazioni ADD COLUMN IF NOT EXISTS slot_orario_id INTEGER REFERENCES slot_orari(id) ON DELETE CASCADE;

-- 6. Aggiorna le assegnazioni esistenti per collegarle agli slot orari
UPDATE assegnazioni 
SET slot_orario_id = so.id
FROM slot_orari so
WHERE assegnazioni.postazione_id = so.postazione_id
  AND assegnazioni.orario_inizio = so.orario_inizio
  AND assegnazioni.orario_fine = so.orario_fine;

-- 7. Rimuovi le colonne orario_inizio e orario_fine dalla tabella postazioni
-- (Opzionale - commenta se vuoi mantenere la compatibilità)
-- ALTER TABLE postazioni DROP COLUMN IF EXISTS orario_inizio;
-- ALTER TABLE postazioni DROP COLUMN IF EXISTS orario_fine;

-- 8. Verifica la migrazione
SELECT 
    p.id,
    p.luogo,
    p.indirizzo,
    COUNT(so.id) as num_slot_orari,
    array_agg(so.orario_inizio || '-' || so.orario_fine) as orari
FROM postazioni p
LEFT JOIN slot_orari so ON p.id = so.postazione_id
GROUP BY p.id, p.luogo, p.indirizzo
ORDER BY p.id; 