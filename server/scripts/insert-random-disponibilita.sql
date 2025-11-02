-- Script per inserire disponibilità random per ogni proclamatore
-- Simula un comportamento realistico con alcuni slot disponibili e altri no

-- Prima, assicuriamoci di avere slot orari definiti per le postazioni
-- Se non esistono, li creiamo
INSERT INTO slot_orari (postazione_id, orario_inizio, orario_fine, max_volontari, stato)
SELECT 
  p.id,
  '09:00'::time,
  '11:00'::time,
  3,
  'attivo'
FROM postazioni p
WHERE p.stato = 'attiva'
  AND NOT EXISTS (
    SELECT 1 FROM slot_orari so 
    WHERE so.postazione_id = p.id 
    AND so.orario_inizio = '09:00'::time 
    AND so.orario_fine = '11:00'::time
  )
ON CONFLICT DO NOTHING;

INSERT INTO slot_orari (postazione_id, orario_inizio, orario_fine, max_volontari, stato)
SELECT 
  p.id,
  '11:00'::time,
  '13:00'::time,
  3,
  'attivo'
FROM postazioni p
WHERE p.stato = 'attiva'
  AND NOT EXISTS (
    SELECT 1 FROM slot_orari so 
    WHERE so.postazione_id = p.id 
    AND so.orario_inizio = '11:00'::time 
    AND so.orario_fine = '13:00'::time
  )
ON CONFLICT DO NOTHING;

INSERT INTO slot_orari (postazione_id, orario_inizio, orario_fine, max_volontari, stato)
SELECT 
  p.id,
  '14:00'::time,
  '16:00'::time,
  3,
  'attivo'
FROM postazioni p
WHERE p.stato = 'attiva'
  AND NOT EXISTS (
    SELECT 1 FROM slot_orari so 
    WHERE so.postazione_id = p.id 
    AND so.orario_inizio = '14:00'::time 
    AND so.orario_fine = '16:00'::time
  )
ON CONFLICT DO NOTHING;

INSERT INTO slot_orari (postazione_id, orario_inizio, orario_fine, max_volontari, stato)
SELECT 
  p.id,
  '16:00'::time,
  '18:00'::time,
  3,
  'attivo'
FROM postazioni p
WHERE p.stato = 'attiva'
  AND NOT EXISTS (
    SELECT 1 FROM slot_orari so 
    WHERE so.postazione_id = p.id 
    AND so.orario_inizio = '16:00'::time 
    AND so.orario_fine = '18:00'::time
  )
ON CONFLICT DO NOTHING;

-- Ora inseriamo disponibilità random per i prossimi 30 giorni
-- Simuliamo diversi pattern di disponibilità per ogni volontario

-- 1. Volontari molto disponibili (80-90% di disponibilità)
WITH volontari_molto_disponibili AS (
  SELECT id FROM volontari 
  WHERE ruolo = 'volontario' AND stato = 'attivo'
  ORDER BY id
  LIMIT 3
),
date_range AS (
  SELECT generate_series(
    CURRENT_DATE + 1, 
    CURRENT_DATE + 30, 
    '1 day'::interval
  )::date AS data
),
slot_orari_available AS (
  SELECT DISTINCT so.orario_inizio, so.orario_fine
  FROM slot_orari so
  JOIN postazioni p ON so.postazione_id = p.id
  WHERE so.stato = 'attivo' AND p.stato = 'attiva'
)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato, postazione_id)
SELECT 
  v.id,
  dr.data,
  so.orario_inizio,
  so.orario_fine,
  CASE 
    WHEN random() < 0.85 THEN 'disponibile'  -- 85% di probabilità di essere disponibile
    ELSE 'non_disponibile'
  END,
  (SELECT p.id FROM postazioni p 
   JOIN slot_orari s ON p.id = s.postazione_id 
   WHERE s.orario_inizio = so.orario_inizio 
   AND s.orario_fine = so.orario_fine 
   AND p.stato = 'attiva'
   ORDER BY random() 
   LIMIT 1)
FROM volontari_molto_disponibili v
CROSS JOIN date_range dr
CROSS JOIN slot_orari_available so
WHERE EXTRACT(dow FROM dr.data) IN (1,2,3,4,5,6,7)  -- Tutti i giorni
ON CONFLICT (volontario_id, data, orario_inizio, postazione_id) DO NOTHING;

-- 2. Volontari moderatamente disponibili (60-70% di disponibilità)
WITH volontari_moderati AS (
  SELECT id FROM volontari 
  WHERE ruolo = 'volontario' AND stato = 'attivo'
  ORDER BY id
  LIMIT 3 OFFSET 3
),
date_range AS (
  SELECT generate_series(
    CURRENT_DATE + 1, 
    CURRENT_DATE + 30, 
    '1 day'::interval
  )::date AS data
),
slot_orari_available AS (
  SELECT DISTINCT so.orario_inizio, so.orario_fine
  FROM slot_orari so
  JOIN postazioni p ON so.postazione_id = p.id
  WHERE so.stato = 'attivo' AND p.stato = 'attiva'
)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato, postazione_id)
SELECT 
  v.id,
  dr.data,
  so.orario_inizio,
  so.orario_fine,
  CASE 
    WHEN random() < 0.65 THEN 'disponibile'  -- 65% di probabilità
    ELSE 'non_disponibile'
  END,
  (SELECT p.id FROM postazioni p 
   JOIN slot_orari s ON p.id = s.postazione_id 
   WHERE s.orario_inizio = so.orario_inizio 
   AND s.orario_fine = so.orario_fine 
   AND p.stato = 'attiva'
   ORDER BY random() 
   LIMIT 1)
FROM volontari_moderati v
CROSS JOIN date_range dr
CROSS JOIN slot_orari_available so
WHERE EXTRACT(dow FROM dr.data) IN (1,2,3,4,5,6,7)  -- Tutti i giorni
ON CONFLICT (volontario_id, data, orario_inizio, postazione_id) DO NOTHING;

-- 3. Volontari poco disponibili (40-50% di disponibilità)
WITH volontari_poco_disponibili AS (
  SELECT id FROM volontari 
  WHERE ruolo = 'volontario' AND stato = 'attivo'
  ORDER BY id
  LIMIT 4 OFFSET 6
),
date_range AS (
  SELECT generate_series(
    CURRENT_DATE + 1, 
    CURRENT_DATE + 30, 
    '1 day'::interval
  )::date AS data
),
slot_orari_available AS (
  SELECT DISTINCT so.orario_inizio, so.orario_fine
  FROM slot_orari so
  JOIN postazioni p ON so.postazione_id = p.id
  WHERE so.stato = 'attivo' AND p.stato = 'attiva'
)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato, postazione_id)
SELECT 
  v.id,
  dr.data,
  so.orario_inizio,
  so.orario_fine,
  CASE 
    WHEN random() < 0.45 THEN 'disponibile'  -- 45% di probabilità
    ELSE 'non_disponibile'
  END,
  (SELECT p.id FROM postazioni p 
   JOIN slot_orari s ON p.id = s.postazione_id 
   WHERE s.orario_inizio = so.orario_inizio 
   AND s.orario_fine = so.orario_fine 
   AND p.stato = 'attiva'
   ORDER BY random() 
   LIMIT 1)
FROM volontari_poco_disponibili v
CROSS JOIN date_range dr
CROSS JOIN slot_orari_available so
WHERE EXTRACT(dow FROM dr.data) IN (1,2,3,4,5,6,7)  -- Tutti i giorni
ON CONFLICT (volontario_id, data, orario_inizio, postazione_id) DO NOTHING;

-- Aggiungiamo anche alcune preferenze temporali realistiche
-- Alcuni volontari preferiscono solo mattina
UPDATE disponibilita 
SET stato = 'non_disponibile'
WHERE volontario_id IN (
  SELECT id FROM volontari 
  WHERE ruolo = 'volontario' AND stato = 'attivo'
  ORDER BY id
  LIMIT 2
)
AND orario_inizio IN ('14:00', '16:00')
AND random() < 0.8;  -- 80% di probabilità di non essere disponibile nel pomeriggio

-- Alcuni volontari preferiscono solo pomeriggio
UPDATE disponibilita 
SET stato = 'non_disponibile'
WHERE volontario_id IN (
  SELECT id FROM volontari 
  WHERE ruolo = 'volontario' AND stato = 'attivo'
  ORDER BY id
  LIMIT 2 OFFSET 8
)
AND orario_inizio IN ('09:00', '11:00')
AND random() < 0.7;  -- 70% di probabilità di non essere disponibile al mattino

-- Alcuni volontari non sono disponibili nei weekend
UPDATE disponibilita 
SET stato = 'non_disponibile'
WHERE volontario_id IN (
  SELECT id FROM volontari 
  WHERE ruolo = 'volontario' AND stato = 'attivo'
  ORDER BY id
  LIMIT 1 OFFSET 5
)
AND EXTRACT(dow FROM data) IN (6, 7)  -- Sabato e domenica
AND random() < 0.9;  -- 90% di probabilità di non essere disponibile nei weekend

-- Statistiche finali
SELECT 
  'Statistiche disponibilità inserite:' as info,
  COUNT(*) as totale_disponibilita,
  COUNT(CASE WHEN stato = 'disponibile' THEN 1 END) as disponibili,
  COUNT(CASE WHEN stato = 'non_disponibile' THEN 1 END) as non_disponibili,
  ROUND(
    COUNT(CASE WHEN stato = 'disponibile' THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) as percentuale_disponibili
FROM disponibilita 
WHERE data >= CURRENT_DATE + 1; 