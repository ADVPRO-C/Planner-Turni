-- Script per aggiungere la colonna postazione_id alla tabella disponibilita
-- Esegui questo script per aggiornare il database esistente

-- Aggiungi la colonna postazione_id
ALTER TABLE disponibilita ADD COLUMN IF NOT EXISTS postazione_id INTEGER REFERENCES postazioni(id) ON DELETE CASCADE;

-- Aggiorna il vincolo UNIQUE per includere postazione_id
-- Prima rimuovi il vincolo esistente
ALTER TABLE disponibilita DROP CONSTRAINT IF EXISTS disponibilita_volontario_id_data_orario_inizio_key;

-- Aggiungi il nuovo vincolo UNIQUE che include postazione_id
ALTER TABLE disponibilita ADD CONSTRAINT disponibilita_volontario_id_data_orario_inizio_postazione_id_key 
UNIQUE(volontario_id, data, orario_inizio, postazione_id);

-- Aggiungi un indice per ottimizzare le query
CREATE INDEX IF NOT EXISTS idx_disponibilita_postazione_id ON disponibilita(postazione_id);

-- Verifica la struttura aggiornata
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'disponibilita' AND column_name = 'postazione_id'; 