-- Migration: Crea tabella documenti_autorizzazioni
-- Ogni congregazione può caricare PDF di autorizzazioni
-- Solo admin/super_admin possono caricare/eliminare
-- Tutti possono visualizzare

CREATE TABLE IF NOT EXISTS public.documenti_autorizzazioni (
    id SERIAL PRIMARY KEY,
    congregazione_id INTEGER NOT NULL,
    nome_file VARCHAR(255) NOT NULL,
    nome_originale VARCHAR(255) NOT NULL,
    descrizione TEXT,
    path_file VARCHAR(500) NOT NULL,
    dimensione_file BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_documenti_congregazione 
        FOREIGN KEY (congregazione_id) 
        REFERENCES public.congregazioni(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_documenti_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES public.volontari(id) 
        ON DELETE RESTRICT
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_documenti_congregazione 
    ON public.documenti_autorizzazioni(congregazione_id);
CREATE INDEX IF NOT EXISTS idx_documenti_created_at 
    ON public.documenti_autorizzazioni(created_at DESC);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_documenti_autorizzazioni_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_documenti_autorizzazioni_updated_at
    BEFORE UPDATE ON public.documenti_autorizzazioni
    FOR EACH ROW
    EXECUTE FUNCTION update_documenti_autorizzazioni_updated_at();

-- Commenti per documentazione
COMMENT ON TABLE public.documenti_autorizzazioni IS 'Documenti PDF di autorizzazioni per ogni congregazione';
COMMENT ON COLUMN public.documenti_autorizzazioni.congregazione_id IS 'ID della congregazione proprietaria del documento';
COMMENT ON COLUMN public.documenti_autorizzazioni.nome_file IS 'Nome del file salvato sul server';
COMMENT ON COLUMN public.documenti_autorizzazioni.nome_originale IS 'Nome originale del file caricato dall utente';
COMMENT ON COLUMN public.documenti_autorizzazioni.path_file IS 'Path relativo del file sul server';
COMMENT ON COLUMN public.documenti_autorizzazioni.dimensione_file IS 'Dimensione del file in bytes';

