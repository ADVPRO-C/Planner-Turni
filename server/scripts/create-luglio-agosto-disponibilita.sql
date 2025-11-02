-- Script per creare disponibilità per luglio e agosto 2025
-- Esclude l'admin (id = 1) e crea disponibilità per tutti gli altri volontari attivi

-- Funzione per generare disponibilità casuali
DO $$
DECLARE
    volontario RECORD;
    slot RECORD;
    data_corrente DATE;
    giorni_settimana INTEGER[] := '{1,2,3,4,5,6,7}'; -- Tutti i giorni
    disponibilita_count INTEGER := 0;
BEGIN
    -- Per ogni volontario (escluso admin)
    FOR volontario IN SELECT id, nome, cognome FROM volontari WHERE stato = 'attivo' AND id != 1 ORDER BY id LOOP
        
        -- Per ogni slot orario
        FOR slot IN SELECT id, orario_inizio, orario_fine, postazione_id FROM slot_orari WHERE stato = 'attivo' ORDER BY id LOOP
            
            -- Per ogni data da luglio ad agosto 2025
            data_corrente := '2025-07-01'::DATE;
            
            WHILE data_corrente <= '2025-08-31'::DATE LOOP
                
                -- Inserisci disponibilità con probabilità 70% (per rendere realistico)
                IF random() < 0.7 THEN
                    INSERT INTO disponibilita (volontario_id, data, stato, slot_orario_id)
                    VALUES (
                        volontario.id,
                        data_corrente,
                        'disponibile',
                        slot.id
                    )
                    ON CONFLICT (volontario_id, data, slot_orario_id) DO NOTHING;
                    
                    disponibilita_count := disponibilita_count + 1;
                END IF;
                
                data_corrente := data_corrente + INTERVAL '1 day';
            END LOOP;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Inserite % disponibilità per luglio e agosto 2025', disponibilita_count;
END $$;

-- Verifica i risultati
SELECT 
    COUNT(*) as total_disponibilita_luglio_agosto,
    MIN(data) as data_minima,
    MAX(data) as data_massima
FROM disponibilita 
WHERE data >= '2025-07-01' AND data <= '2025-08-31';

-- Mostra alcune disponibilità di esempio
SELECT 
    d.data,
    so.orario_inizio,
    so.orario_fine,
    p.luogo,
    v.nome,
    v.cognome
FROM disponibilita d
JOIN slot_orari so ON d.slot_orario_id = so.id
JOIN postazioni p ON so.postazione_id = p.id
JOIN volontari v ON d.volontario_id = v.id
WHERE d.data >= '2025-07-01' AND d.data <= '2025-07-07'
ORDER BY d.data, so.orario_inizio, v.nome
LIMIT 20; 