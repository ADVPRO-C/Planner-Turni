-- Script per creare disponibilità per Piazza Giotto
-- Piazza Giotto è attiva domenica (1) e sabato (7)

-- Genera disponibilità per Piazza Giotto dal 23 luglio al 1 agosto 2025
-- Solo per domeniche e sabati

INSERT INTO disponibilita (volontario_id, data, slot_orario_id, stato, note)
SELECT 
    v.id as volontario_id,
    d as data,
    so.id as slot_orario_id,
    'disponibile' as stato,
    'Generato automaticamente per Piazza Giotto' as note
FROM 
    generate_series('2025-07-23'::date, '2025-08-01'::date, '1 day'::interval) d
    CROSS JOIN volontari v
    CROSS JOIN slot_orari so
WHERE 
    -- Solo domeniche (1) e sabati (7)
    CASE 
        WHEN EXTRACT(DOW FROM d) = 0 THEN 1  -- Domenica
        WHEN EXTRACT(DOW FROM d) = 6 THEN 7  -- Sabato
    END IN (1, 7)
    -- Solo volontari attivi
    AND v.stato = 'attivo'
    -- Solo slot orari di Piazza Giotto
    AND so.postazione_id = 16
    -- Solo slot orari attivi
    AND so.stato = 'attivo'
    -- Escludi volontari che hanno già disponibilità per questa data e slot
    AND NOT EXISTS (
        SELECT 1 FROM disponibilita d2 
        WHERE d2.volontario_id = v.id 
        AND d2.data = d 
        AND d2.slot_orario_id = so.id
    )
    -- Aggiungi un po' di casualità (circa 70% di probabilità)
    AND random() < 0.7;

-- Verifica le disponibilità create
SELECT 
    p.luogo,
    so.orario_inizio,
    so.orario_fine,
    COUNT(disp.id) as num_disponibilita,
    MIN(disp.data) as data_inizio,
    MAX(disp.data) as data_fine
FROM disponibilita disp
JOIN slot_orari so ON disp.slot_orario_id = so.id
JOIN postazioni p ON so.postazione_id = p.id
WHERE p.luogo = 'Piazza Giotto'
    AND disp.data BETWEEN '2025-07-23' AND '2025-08-01'
GROUP BY p.luogo, so.orario_inizio, so.orario_fine
ORDER BY so.orario_inizio; 