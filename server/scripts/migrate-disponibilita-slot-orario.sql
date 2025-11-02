-- Script per migrare la tabella disponibilita per usare slot_orario_id
-- 1. Aggiungi la colonna slot_orario_id
ALTER TABLE disponibilita ADD COLUMN slot_orario_id INTEGER;

-- 2. Aggiorna le disponibilità esistenti per collegarle agli slot orari
UPDATE disponibilita 
SET slot_orario_id = so.id
FROM slot_orari so
WHERE disponibilita.orario_inizio = so.orario_inizio 
  AND disponibilita.orario_fine = so.orario_fine;

-- 3. Aggiungi la foreign key constraint
ALTER TABLE disponibilita 
ADD CONSTRAINT disponibilita_slot_orario_id_fkey 
FOREIGN KEY (slot_orario_id) REFERENCES slot_orari(id) ON DELETE CASCADE;

-- 4. Rendi la colonna NOT NULL
ALTER TABLE disponibilita ALTER COLUMN slot_orario_id SET NOT NULL;

-- 5. Rimuovi le colonne orario_inizio e orario_fine (dopo aver verificato che la migrazione sia andata a buon fine)
-- ALTER TABLE disponibilita DROP COLUMN orario_inizio;
-- ALTER TABLE disponibilita DROP COLUMN orario_fine;

-- 6. Aggiorna l'indice unique
DROP INDEX IF EXISTS disponibilita_volontario_id_data_orario_inizio_key;
CREATE UNIQUE INDEX disponibilita_volontario_id_data_slot_orario_id_key 
ON disponibilita(volontario_id, data, slot_orario_id);

-- Verifica finale
SELECT 'Migrazione completata!' as risultato;
SELECT COUNT(*) as disponibilita_migrate FROM disponibilita WHERE slot_orario_id IS NOT NULL;
SELECT COUNT(*) as disponibilita_totali FROM disponibilita; 