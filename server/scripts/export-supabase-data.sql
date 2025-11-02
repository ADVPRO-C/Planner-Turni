-- ============================================
-- EXPORT DATI DA SUPABASE
-- ============================================
-- Esegui queste query in Supabase Dashboard → SQL Editor
-- Copia i risultati e incollali negli script di import
-- ============================================

-- 1. EXPORT CONGREGAZIONI
SELECT 
  id,
  codice,
  nome,
  created_at,
  updated_at
FROM congregazioni
ORDER BY id;

-- 2. EXPORT VOLONTARI
SELECT 
  id,
  congregazione_id,
  nome,
  cognome,
  sesso,
  stato,
  ultima_assegnazione,
  email,
  telefono,
  password_hash,
  ruolo,
  created_at,
  updated_at
FROM volontari
ORDER BY id;

-- 3. EXPORT POSTAZIONI
SELECT 
  id,
  congregazione_id,
  luogo,
  indirizzo,
  giorni_settimana,
  stato,
  max_proclamatori,
  created_at,
  updated_at
FROM postazioni
ORDER BY id;

-- 4. EXPORT SLOT_ORARI
SELECT 
  id,
  postazione_id,
  congregazione_id,
  orario_inizio,
  orario_fine,
  max_volontari,
  stato,
  created_at,
  updated_at
FROM slot_orari
ORDER BY id;

-- 5. EXPORT DISPONIBILITA
SELECT 
  id,
  volontario_id,
  congregazione_id,
  data,
  stato,
  note,
  created_at,
  slot_orario_id
FROM disponibilita
ORDER BY id;

-- 6. EXPORT ASSEGNAZIONI
SELECT 
  id,
  postazione_id,
  congregazione_id,
  slot_orario_id,
  data_turno,
  stato,
  note,
  created_at,
  updated_at
FROM assegnazioni
ORDER BY id;

-- 7. EXPORT ASSEGNAZIONI_VOLONTARI
SELECT 
  id,
  assegnazione_id,
  volontario_id,
  congregazione_id,
  ruolo_turno,
  created_at
FROM assegnazioni_volontari
ORDER BY id;

-- 8. EXPORT NOTIFICHE (se esiste)
SELECT 
  id,
  tipo,
  titolo,
  messaggio,
  destinatario_id,
  letta,
  created_at
FROM notifiche
ORDER BY id;

-- 9. EXPORT NOTIFICATIONS (se esiste)
SELECT 
  id,
  type,
  title,
  message,
  details,
  timestamp,
  read,
  admin_id,
  created_at,
  updated_at
FROM notifications
ORDER BY id;

-- 10. EXPORT ESPERIENZE (se esiste)
-- SELECT * FROM esperienze ORDER BY id;

-- 11. EXPORT DOCUMENTI (se esiste)
-- SELECT * FROM documenti ORDER BY id;

