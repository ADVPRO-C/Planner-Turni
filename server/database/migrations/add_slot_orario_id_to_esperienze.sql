-- Migration: Add slot_orario_id to esperienze table
-- Created: 2025-01-XX
-- Description: Aggiunge il campo slot_orario_id per associare l'esperienza a una specifica fascia oraria

-- Aggiungi colonna slot_orario_id (opzionale, può essere NULL)
ALTER TABLE public.esperienze
ADD COLUMN IF NOT EXISTS slot_orario_id integer;

-- Aggiungi foreign key constraint (se non esiste già)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'esperienze_slot_orario_id_fkey'
    ) THEN
        ALTER TABLE public.esperienze
        ADD CONSTRAINT esperienze_slot_orario_id_fkey 
            FOREIGN KEY (slot_orario_id) 
            REFERENCES public.slot_orari(id) 
            ON DELETE SET NULL;
    END IF;
END $$;

-- Aggiungi indice per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS idx_esperienze_slot_orario_id 
    ON public.esperienze USING btree (slot_orario_id);

