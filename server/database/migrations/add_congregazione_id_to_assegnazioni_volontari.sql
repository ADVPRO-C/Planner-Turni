-- Migrazione: Aggiungi colonna congregazione_id alla tabella assegnazioni_volontari
-- Data: 2025-01-XX
-- Descrizione: Aggiunge la colonna congregazione_id se non esiste già

-- Verifica se la colonna esiste già, se no la aggiunge
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'assegnazioni_volontari' 
        AND column_name = 'congregazione_id'
    ) THEN
        -- Aggiungi la colonna
        ALTER TABLE public.assegnazioni_volontari
        ADD COLUMN congregazione_id INTEGER NOT NULL DEFAULT 1;
        
        -- Rimuovi il default dopo aver popolato i dati esistenti
        ALTER TABLE public.assegnazioni_volontari
        ALTER COLUMN congregazione_id DROP DEFAULT;
        
        -- Aggiungi foreign key constraint
        ALTER TABLE public.assegnazioni_volontari
        ADD CONSTRAINT assegnazioni_volontari_congregazione_id_fkey 
        FOREIGN KEY (congregazione_id) 
        REFERENCES public.congregazioni(id) 
        ON DELETE CASCADE;
        
        -- Popola i dati esistenti usando la congregazione_id dell'assegnazione
        UPDATE public.assegnazioni_volontari av
        SET congregazione_id = a.congregazione_id
        FROM public.assegnazioni a
        WHERE av.assegnazione_id = a.id
        AND av.congregazione_id = 1; -- Solo quelli con default
        
        -- Se non ci sono assegnazioni, popola usando la congregazione del volontario
        UPDATE public.assegnazioni_volontari av
        SET congregazione_id = v.congregazione_id
        FROM public.volontari v
        WHERE av.volontario_id = v.id
        AND av.congregazione_id = 1; -- Solo quelli con default rimasti
        
        RAISE NOTICE 'Colonna congregazione_id aggiunta alla tabella assegnazioni_volontari';
    ELSE
        RAISE NOTICE 'Colonna congregazione_id già esistente nella tabella assegnazioni_volontari';
    END IF;
END $$;

-- Crea indice se non esiste
CREATE INDEX IF NOT EXISTS idx_assegnazioni_volontari_congregazione 
ON public.assegnazioni_volontari(congregazione_id);

