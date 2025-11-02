-- Script per semplificare la tabella disponibilita
-- Rimuove i campi ridondanti orario_inizio e orario_fine
-- Mantiene solo slot_orario_id che è sufficiente per identificare l'orario

-- 1. Verifica che non ci siano inconsistenze prima di procedere
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN d.orario_inizio = so.orario_inizio AND d.orario_fine = so.orario_fine THEN 1 END) as consistent_records,
    COUNT(CASE WHEN d.orario_inizio != so.orario_inizio OR d.orario_fine != so.orario_fine THEN 1 END) as inconsistent_records
FROM disponibilita d
JOIN slot_orari so ON d.slot_orario_id = so.id;

-- 2. Rimuovi i campi ridondanti
ALTER TABLE disponibilita DROP COLUMN IF EXISTS orario_inizio;
ALTER TABLE disponibilita DROP COLUMN IF EXISTS orario_fine;

-- 3. Verifica la nuova struttura
\d disponibilita

-- 4. Testa che tutto funzioni ancora
SELECT 
    d.id,
    d.volontario_id,
    d.data,
    d.stato,
    so.orario_inizio,
    so.orario_fine,
    p.luogo,
    v.nome,
    v.cognome
FROM disponibilita d
JOIN slot_orari so ON d.slot_orario_id = so.id
JOIN postazioni p ON so.postazione_id = p.id
JOIN volontari v ON d.volontario_id = v.id
WHERE d.data >= '2025-07-23' AND d.data <= '2025-07-30'
ORDER BY d.data, so.orario_inizio
LIMIT 10; 