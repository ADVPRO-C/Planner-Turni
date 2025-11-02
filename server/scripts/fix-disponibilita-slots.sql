-- Script per ricreare disponibilità che corrispondono esattamente agli slot orari
-- Prima puliamo le disponibilità esistenti (escluso admin)
DELETE FROM disponibilita WHERE volontario_id > 1;

-- Otteniamo gli slot orari dalle postazioni
-- Piazza Giotto: 09:00-11:00, 14:00-16:00
-- Stazione Centrale: 08:00-10:00, 13:00-15:00, 16:00-18:00  
-- Stazione Notarbartolo: 10:00-12:00, 15:00-17:00

-- Generiamo disponibilità per ogni volontario (ID 2-11) per le prossime 4 settimane
-- Usando SOLO gli slot orari delle postazioni

-- Volontario 2 (Mario Rossi) - Disponibilità varie
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
-- Piazza Giotto slots
(2, '2025-01-27', '09:00:00', '11:00:00', 'disponibile'),
(2, '2025-01-28', '14:00:00', '16:00:00', 'disponibile'),
(2, '2025-01-30', '09:00:00', '11:00:00', 'disponibile'),
-- Stazione Centrale slots
(2, '2025-02-01', '08:00:00', '10:00:00', 'disponibile'),
(2, '2025-02-03', '13:00:00', '15:00:00', 'disponibile'),
(2, '2025-02-05', '16:00:00', '18:00:00', 'disponibile'),
-- Stazione Notarbartolo slots
(2, '2025-02-07', '10:00:00', '12:00:00', 'disponibile'),
(2, '2025-02-09', '15:00:00', '17:00:00', 'disponibile');

-- Volontario 3 (Giulia Bianchi)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
(3, '2025-01-27', '14:00:00', '16:00:00', 'disponibile'),
(3, '2025-01-29', '08:00:00', '10:00:00', 'disponibile'),
(3, '2025-01-31', '13:00:00', '15:00:00', 'disponibile'),
(3, '2025-02-02', '16:00:00', '18:00:00', 'disponibile'),
(3, '2025-02-04', '10:00:00', '12:00:00', 'disponibile'),
(3, '2025-02-06', '15:00:00', '17:00:00', 'disponibile'),
(3, '2025-02-08', '09:00:00', '11:00:00', 'disponibile'),
(3, '2025-02-10', '14:00:00', '16:00:00', 'disponibile');

-- Volontario 4 (Luca Verdi)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
(4, '2025-01-28', '09:00:00', '11:00:00', 'disponibile'),
(4, '2025-01-30', '14:00:00', '16:00:00', 'disponibile'),
(4, '2025-02-01', '08:00:00', '10:00:00', 'disponibile'),
(4, '2025-02-03', '13:00:00', '15:00:00', 'disponibile'),
(4, '2025-02-05', '16:00:00', '18:00:00', 'disponibile'),
(4, '2025-02-07', '10:00:00', '12:00:00', 'disponibile'),
(4, '2025-02-09', '15:00:00', '17:00:00', 'disponibile'),
(4, '2025-02-11', '09:00:00', '11:00:00', 'disponibile');

-- Volontario 5 (Anna Neri)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
(5, '2025-01-27', '08:00:00', '10:00:00', 'disponibile'),
(5, '2025-01-29', '13:00:00', '15:00:00', 'disponibile'),
(5, '2025-01-31', '16:00:00', '18:00:00', 'disponibile'),
(5, '2025-02-02', '10:00:00', '12:00:00', 'disponibile'),
(5, '2025-02-04', '15:00:00', '17:00:00', 'disponibile'),
(5, '2025-02-06', '09:00:00', '11:00:00', 'disponibile'),
(5, '2025-02-08', '14:00:00', '16:00:00', 'disponibile'),
(5, '2025-02-10', '08:00:00', '10:00:00', 'disponibile');

-- Volontario 6 (Marco Gialli)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
(6, '2025-01-28', '14:00:00', '16:00:00', 'disponibile'),
(6, '2025-01-30', '08:00:00', '10:00:00', 'disponibile'),
(6, '2025-02-01', '13:00:00', '15:00:00', 'disponibile'),
(6, '2025-02-03', '16:00:00', '18:00:00', 'disponibile'),
(6, '2025-02-05', '10:00:00', '12:00:00', 'disponibile'),
(6, '2025-02-07', '15:00:00', '17:00:00', 'disponibile'),
(6, '2025-02-09', '09:00:00', '11:00:00', 'disponibile'),
(6, '2025-02-11', '14:00:00', '16:00:00', 'disponibile');

-- Volontario 7 (Sofia Rosa)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
(7, '2025-01-27', '09:00:00', '11:00:00', 'disponibile'),
(7, '2025-01-29', '14:00:00', '16:00:00', 'disponibile'),
(7, '2025-01-31', '08:00:00', '10:00:00', 'disponibile'),
(7, '2025-02-02', '13:00:00', '15:00:00', 'disponibile'),
(7, '2025-02-04', '16:00:00', '18:00:00', 'disponibile'),
(7, '2025-02-06', '10:00:00', '12:00:00', 'disponibile'),
(7, '2025-02-08', '15:00:00', '17:00:00', 'disponibile'),
(7, '2025-02-10', '09:00:00', '11:00:00', 'disponibile');

-- Volontario 8 (Paolo Blu)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
(8, '2025-01-28', '08:00:00', '10:00:00', 'disponibile'),
(8, '2025-01-30', '13:00:00', '15:00:00', 'disponibile'),
(8, '2025-02-01', '16:00:00', '18:00:00', 'disponibile'),
(8, '2025-02-03', '10:00:00', '12:00:00', 'disponibile'),
(8, '2025-02-05', '15:00:00', '17:00:00', 'disponibile'),
(8, '2025-02-07', '09:00:00', '11:00:00', 'disponibile'),
(8, '2025-02-09', '14:00:00', '16:00:00', 'disponibile'),
(8, '2025-02-11', '08:00:00', '10:00:00', 'disponibile');

-- Volontario 9 (Elena Viola)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
(9, '2025-01-27', '14:00:00', '16:00:00', 'disponibile'),
(9, '2025-01-29', '08:00:00', '10:00:00', 'disponibile'),
(9, '2025-01-31', '13:00:00', '15:00:00', 'disponibile'),
(9, '2025-02-02', '16:00:00', '18:00:00', 'disponibile'),
(9, '2025-02-04', '10:00:00', '12:00:00', 'disponibile'),
(9, '2025-02-06', '15:00:00', '17:00:00', 'disponibile'),
(9, '2025-02-08', '09:00:00', '11:00:00', 'disponibile'),
(9, '2025-02-10', '14:00:00', '16:00:00', 'disponibile');

-- Volontario 10 (Roberto Arancio)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
(10, '2025-01-28', '09:00:00', '11:00:00', 'disponibile'),
(10, '2025-01-30', '14:00:00', '16:00:00', 'disponibile'),
(10, '2025-02-01', '08:00:00', '10:00:00', 'disponibile'),
(10, '2025-02-03', '13:00:00', '15:00:00', 'disponibile'),
(10, '2025-02-05', '16:00:00', '18:00:00', 'disponibile'),
(10, '2025-02-07', '10:00:00', '12:00:00', 'disponibile'),
(10, '2025-02-09', '15:00:00', '17:00:00', 'disponibile'),
(10, '2025-02-11', '09:00:00', '11:00:00', 'disponibile');

-- Volontario 11 (Laura Grigio)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
(11, '2025-01-27', '08:00:00', '10:00:00', 'disponibile'),
(11, '2025-01-29', '13:00:00', '15:00:00', 'disponibile'),
(11, '2025-01-31', '16:00:00', '18:00:00', 'disponibile'),
(11, '2025-02-02', '10:00:00', '12:00:00', 'disponibile'),
(11, '2025-02-04', '15:00:00', '17:00:00', 'disponibile'),
(11, '2025-02-06', '09:00:00', '11:00:00', 'disponibile'),
(11, '2025-02-08', '14:00:00', '16:00:00', 'disponibile'),
(11, '2025-02-10', '08:00:00', '10:00:00', 'disponibile');

-- Verifica finale
SELECT 'Disponibilità ricreate con successo!' as risultato;
SELECT COUNT(*) as totale_disponibilita_volontari FROM disponibilita WHERE volontario_id > 1;

-- Verifica che le disponibilità corrispondano agli slot
SELECT 'Verifica corrispondenza slot:' as info;
SELECT DISTINCT d.orario_inizio, d.orario_fine FROM disponibilita d WHERE d.volontario_id > 1 ORDER BY d.orario_inizio; 