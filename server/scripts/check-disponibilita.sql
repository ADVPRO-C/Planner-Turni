-- Script per verificare le disponibilità inserite

-- 1. Statistiche generali
SELECT 
  'STATISTICHE GENERALI' as sezione,
  COUNT(*) as totale_disponibilita,
  COUNT(CASE WHEN stato = 'disponibile' THEN 1 END) as disponibili,
  COUNT(CASE WHEN stato = 'non_disponibile' THEN 1 END) as non_disponibili,
  ROUND(
    COUNT(CASE WHEN stato = 'disponibile' THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) as percentuale_disponibili
FROM disponibilita 
WHERE data >= CURRENT_DATE + 1;

-- 2. Statistiche per volontario
SELECT 
  'STATISTICHE PER VOLONTARIO' as sezione,
  v.nome || ' ' || v.cognome as volontario,
  COUNT(d.id) as totale_slot,
  COUNT(CASE WHEN d.stato = 'disponibile' THEN 1 END) as disponibili,
  COUNT(CASE WHEN d.stato = 'non_disponibile' THEN 1 END) as non_disponibili,
  ROUND(
    COUNT(CASE WHEN d.stato = 'disponibile' THEN 1 END) * 100.0 / COUNT(d.id), 
    2
  ) as percentuale_disponibili
FROM volontari v
LEFT JOIN disponibilita d ON v.id = d.volontario_id
WHERE v.ruolo = 'volontario' 
  AND v.stato = 'attivo'
  AND d.data >= CURRENT_DATE + 1
GROUP BY v.id, v.nome, v.cognome
ORDER BY percentuale_disponibili DESC;

-- 3. Statistiche per orario
SELECT 
  'STATISTICHE PER ORARIO' as sezione,
  d.orario_inizio || ' - ' || d.orario_fine as orario,
  COUNT(d.id) as totale_slot,
  COUNT(CASE WHEN d.stato = 'disponibile' THEN 1 END) as disponibili,
  COUNT(CASE WHEN d.stato = 'non_disponibile' THEN 1 END) as non_disponibili,
  ROUND(
    COUNT(CASE WHEN d.stato = 'disponibile' THEN 1 END) * 100.0 / COUNT(d.id), 
    2
  ) as percentuale_disponibili
FROM disponibilita d
WHERE d.data >= CURRENT_DATE + 1
GROUP BY d.orario_inizio, d.orario_fine
ORDER BY d.orario_inizio;

-- 4. Statistiche per giorno della settimana
SELECT 
  'STATISTICHE PER GIORNI' as sezione,
  CASE EXTRACT(dow FROM d.data)
    WHEN 1 THEN 'Lunedì'
    WHEN 2 THEN 'Martedì'
    WHEN 3 THEN 'Mercoledì'
    WHEN 4 THEN 'Giovedì'
    WHEN 5 THEN 'Venerdì'
    WHEN 6 THEN 'Sabato'
    WHEN 7 THEN 'Domenica'
  END as giorno,
  COUNT(d.id) as totale_slot,
  COUNT(CASE WHEN d.stato = 'disponibile' THEN 1 END) as disponibili,
  COUNT(CASE WHEN d.stato = 'non_disponibile' THEN 1 END) as non_disponibili,
  ROUND(
    COUNT(CASE WHEN d.stato = 'disponibile' THEN 1 END) * 100.0 / COUNT(d.id), 
    2
  ) as percentuale_disponibili
FROM disponibilita d
WHERE d.data >= CURRENT_DATE + 1
GROUP BY EXTRACT(dow FROM d.data)
ORDER BY EXTRACT(dow FROM d.data);

-- 5. Esempi di disponibilità per i prossimi 7 giorni
SELECT 
  'ESEMPI PROSSIMI 7 GIORNI' as sezione,
  v.nome || ' ' || v.cognome as volontario,
  d.data,
  d.orario_inizio || ' - ' || d.orario_fine as orario,
  p.luogo as postazione,
  d.stato
FROM disponibilita d
JOIN volontari v ON d.volontario_id = v.id
LEFT JOIN postazioni p ON d.postazione_id = p.id
WHERE d.data BETWEEN CURRENT_DATE + 1 AND CURRENT_DATE + 7
  AND v.ruolo = 'volontario'
  AND v.stato = 'attivo'
ORDER BY d.data, d.orario_inizio, v.nome
LIMIT 20; 