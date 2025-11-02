-- Script per aggiungere la colonna max_proclamatori alla tabella postazioni
-- Esegui questo script per aggiornare il database esistente

-- Aggiungi la colonna max_proclamatori alla tabella postazioni
ALTER TABLE postazioni ADD COLUMN IF NOT EXISTS max_proclamatori INTEGER DEFAULT 3;

-- Aggiorna le postazioni esistenti con un valore di default
UPDATE postazioni SET max_proclamatori = 3 WHERE max_proclamatori IS NULL;

-- Aggiungi un vincolo per assicurarsi che il valore sia positivo
ALTER TABLE postazioni ADD CONSTRAINT check_max_proclamatori CHECK (max_proclamatori > 0 AND max_proclamatori <= 10);

-- Verifica che la colonna sia stata aggiunta correttamente
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'postazioni' AND column_name = 'max_proclamatori'; 