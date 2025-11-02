-- Migrazione: Correzione della funzione get_giorno_settimana
-- Problema: La funzione mappava erroneamente 0->1, 1->2, ecc. (Domenica=1)
-- Soluzione: Correggere per avere 1=Lunedì, 2=Martedì, ..., 7=Domenica
-- Data: 2025-01-XX

-- Drop della vecchia funzione
DROP FUNCTION IF EXISTS public.get_giorno_settimana(date);

-- Ricrea la funzione con il mapping corretto
CREATE FUNCTION public.get_giorno_settimana(data_input date) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN CASE 
        WHEN EXTRACT(DOW FROM data_input) = 0 THEN 7  -- Domenica
        WHEN EXTRACT(DOW FROM data_input) = 1 THEN 1  -- Lunedì
        WHEN EXTRACT(DOW FROM data_input) = 2 THEN 2  -- Martedì
        WHEN EXTRACT(DOW FROM data_input) = 3 THEN 3  -- Mercoledì
        WHEN EXTRACT(DOW FROM data_input) = 4 THEN 4  -- Giovedì
        WHEN EXTRACT(DOW FROM data_input) = 5 THEN 5  -- Venerdì
        WHEN EXTRACT(DOW FROM data_input) = 6 THEN 6  -- Sabato
    END;
END;
$$;

