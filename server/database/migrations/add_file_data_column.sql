-- Migration: Aggiungi colonna file_data BYTEA per salvare file nel database
-- Necessario per Railway che ha filesystem temporaneo

ALTER TABLE public.documenti_autorizzazioni
ADD COLUMN IF NOT EXISTS file_data BYTEA;

-- Aggiorna commenti
COMMENT ON COLUMN public.documenti_autorizzazioni.file_data IS 'Contenuto binario del file PDF salvato nel database (per Railway/filesystem temporaneo)';

