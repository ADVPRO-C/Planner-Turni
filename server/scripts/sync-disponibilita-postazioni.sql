-- Script per sincronizzare le disponibilità con le configurazioni delle postazioni
-- Elimina le disponibilità per giorni in cui le postazioni non sono più attive

-- Funzione per ottenere il giorno della settimana nel nostro sistema
-- 1=Domenica, 2=Lunedì, ..., 7=Sabato
CREATE OR REPLACE FUNCTION get_giorno_settimana(data_input date) 
RETURNS integer AS $$
BEGIN
    RETURN CASE 
        WHEN EXTRACT(DOW FROM data_input) = 0 THEN 1  -- Domenica
        WHEN EXTRACT(DOW FROM data_input) = 1 THEN 2  -- Lunedì
        WHEN EXTRACT(DOW FROM data_input) = 2 THEN 3  -- Martedì
        WHEN EXTRACT(DOW FROM data_input) = 3 THEN 4  -- Mercoledì
        WHEN EXTRACT(DOW FROM data_input) = 4 THEN 5  -- Giovedì
        WHEN EXTRACT(DOW FROM data_input) = 5 THEN 6  -- Venerdì
        WHEN EXTRACT(DOW FROM data_input) = 6 THEN 7  -- Sabato
    END;
END;
$$ LANGUAGE plpgsql;

-- Elimina le disponibilità per giorni in cui le postazioni non sono più attive
DELETE FROM disponibilita 
WHERE id IN (
    SELECT d.id
    FROM disponibilita d
    JOIN slot_orari so ON d.slot_orario_id = so.id
    JOIN postazioni p ON so.postazione_id = p.id
    WHERE p.stato = 'attiva'
    AND get_giorno_settimana(d.data) != ALL(p.giorni_settimana)
);

-- Verifica le disponibilità rimanenti per postazione
SELECT 
    p.luogo,
    p.giorni_settimana,
    COUNT(d.id) as disponibilita_rimanenti,
    MIN(d.data) as data_inizio,
    MAX(d.data) as data_fine
FROM postazioni p
LEFT JOIN slot_orari so ON p.id = so.postazione_id
LEFT JOIN disponibilita d ON so.id = d.slot_orario_id
WHERE p.stato = 'attiva'
GROUP BY p.id, p.luogo, p.giorni_settimana
ORDER BY p.id; 