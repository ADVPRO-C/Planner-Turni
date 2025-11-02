-- Migration: Create esperienze table
-- Created: 2025-01-XX

-- Create sequence for esperienze
CREATE SEQUENCE IF NOT EXISTS esperienze_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Create esperienze table
CREATE TABLE IF NOT EXISTS public.esperienze (
    id integer NOT NULL DEFAULT nextval('esperienze_id_seq'::regclass),
    volontario_id integer NOT NULL,
    congregazione_id integer NOT NULL,
    postazione_id integer,
    data date NOT NULL,
    racconto text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT esperienze_pkey PRIMARY KEY (id),
    CONSTRAINT esperienze_volontario_id_fkey FOREIGN KEY (volontario_id) 
        REFERENCES public.volontari(id) ON DELETE CASCADE,
    CONSTRAINT esperienze_congregazione_id_fkey FOREIGN KEY (congregazione_id) 
        REFERENCES public.congregazioni(id) ON DELETE CASCADE,
    CONSTRAINT esperienze_postazione_id_fkey FOREIGN KEY (postazione_id) 
        REFERENCES public.postazioni(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_esperienze_volontario_id ON public.esperienze USING btree (volontario_id);
CREATE INDEX IF NOT EXISTS idx_esperienze_congregazione_id ON public.esperienze USING btree (congregazione_id);
CREATE INDEX IF NOT EXISTS idx_esperienze_postazione_id ON public.esperienze USING btree (postazione_id);
CREATE INDEX IF NOT EXISTS idx_esperienze_data ON public.esperienze USING btree (data DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_esperienze_updated_at 
    BEFORE UPDATE ON public.esperienze 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Set sequence ownership
ALTER SEQUENCE esperienze_id_seq OWNED BY public.esperienze.id;

