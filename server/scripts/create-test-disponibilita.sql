-- Script per creare disponibilità di test per tutti i volontari (escluso admin)
-- Genera disponibilità per le prossime 4 settimane

-- Prima puliamo le disponibilità esistenti (escluso admin)
DELETE FROM disponibilita WHERE volontario_id > 1;

-- Generiamo disponibilità per ogni volontario (ID 2-11)
-- Per ogni volontario, creiamo 2-4 disponibilità a settimana per 4 settimane

-- Volontario 2 (Mario Rossi)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
(2, '2025-01-27', '09:00:00', '11:00:00', 'disponibile'),
(2, '2025-01-28', '14:00:00', '16:00:00', 'disponibile'),
(2, '2025-01-30', '16:00:00', '18:00:00', 'disponibile'),
(2, '2025-02-03', '09:00:00', '11:00:00', 'disponibile'),
(2, '2025-02-05', '14:00:00', '16:00:00', 'disponibile'),
(2, '2025-02-07', '16:00:00', '18:00:00', 'disponibile'),
(2, '2025-02-10', '09:00:00', '11:00:00', 'disponibile'),
(2, '2025-02-12', '14:00:00', '16:00:00', 'disponibile');

-- Volontario 3 (Giulia Bianchi)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
(3, '2025-01-27', '14:00:00', '16:00:00', 'disponibile'),
(3, '2025-01-29', '16:00:00', '18:00:00', 'disponibile'),
(3, '2025-01-31', '09:00:00', '11:00:00', 'disponibile'),
(3, '2025-02-02', '14:00:00', '16:00:00', 'disponibile'),
(3, '2025-02-04', '16:00:00', '18:00:00', 'disponibile'),
(3, '2025-02-06', '09:00:00', '11:00:00', 'disponibile'),
(3, '2025-02-08', '14:00:00', '16:00:00', 'disponibile'),
(3, '2025-02-10', '16:00:00', '18:00:00', 'disponibile');

-- Volontario 4 (Luca Verdi)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
(4, '2025-01-28', '09:00:00', '11:00:00', 'disponibile'),
(4, '2025-01-30', '14:00:00', '16:00:00', 'disponibile'),
(4, '2025-02-01', '16:00:00', '18:00:00', 'disponibile'),
(4, '2025-02-03', '14:00:00', '16:00:00', 'disponibile'),
(4, '2025-02-05', '09:00:00', '11:00:00', 'disponibile'),
(4, '2025-02-07', '14:00:00', '16:00:00', 'disponibile'),
(4, '2025-02-09', '16:00:00', '18:00:00', 'disponibile'),
(4, '2025-02-11', '09:00:00', '11:00:00', 'disponibile');

-- Volontario 5 (Anna Neri)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
(5, '2025-01-27', '16:00:00', '18:00:00', 'disponibile'),
(5, '2025-01-29', '09:00:00', '11:00:00', 'disponibile'),
(5, '2025-01-31', '14:00:00', '16:00:00', 'disponibile'),
(5, '2025-02-02', '16:00:00', '18:00:00', 'disponibile'),
(5, '2025-02-04', '09:00:00', '11:00:00', 'disponibile'),
(5, '2025-02-06', '14:00:00', '16:00:00', 'disponibile'),
(5, '2025-02-08', '16:00:00', '18:00:00', 'disponibile'),
(5, '2025-02-10', '09:00:00', '11:00:00', 'disponibile');

-- Volontario 6 (Marco Gialli)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
(6, '2025-01-28', '14:00:00', '16:00:00', 'disponibile'),
(6, '2025-01-30', '09:00:00', '11:00:00', 'disponibile'),
(6, '2025-02-01', '14:00:00', '16:00:00', 'disponibile'),
(6, '2025-02-03', '16:00:00', '18:00:00', 'disponibile'),
(6, '2025-02-05', '14:00:00', '16:00:00', 'disponibile'),
(6, '2025-02-07', '09:00:00', '11:00:00', 'disponibile'),
(6, '2025-02-09', '14:00:00', '16:00:00', 'disponibile'),
(6, '2025-02-11', '16:00:00', '18:00:00', 'disponibile');

-- Volontario 7 (Sofia Rosa)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
(7, '2025-01-27', '09:00:00', '11:00:00', 'disponibile'),
(7, '2025-01-29', '14:00:00', '16:00:00', 'disponibile'),
(7, '2025-01-31', '16:00:00', '18:00:00', 'disponibile'),
(7, '2025-02-02', '09:00:00', '11:00:00', 'disponibile'),
(7, '2025-02-04', '14:00:00', '16:00:00', 'disponibile'),
(7, '2025-02-06', '16:00:00', '18:00:00', 'disponibile'),
(7, '2025-02-08', '09:00:00', '11:00:00', 'disponibile'),
(7, '2025-02-10', '14:00:00', '16:00:00', 'disponibile');

-- Volontario 8 (Paolo Blu)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
(8, '2025-01-28', '16:00:00', '18:00:00', 'disponibile'),
(8, '2025-01-30', '14:00:00', '16:00:00', 'disponibile'),
(8, '2025-02-01', '09:00:00', '11:00:00', 'disponibile'),
(8, '2025-02-03', '14:00:00', '16:00:00', 'disponibile'),
(8, '2025-02-05', '16:00:00', '18:00:00', 'disponibile'),
(8, '2025-02-07', '14:00:00', '16:00:00', 'disponibile'),
(8, '2025-02-09', '09:00:00', '11:00:00', 'disponibile'),
(8, '2025-02-11', '14:00:00', '16:00:00', 'disponibile');

-- Volontario 9 (Elena Viola)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
(9, '2025-01-27', '14:00:00', '16:00:00', 'disponibile'),
(9, '2025-01-29', '16:00:00', '18:00:00', 'disponibile'),
(9, '2025-01-31', '09:00:00', '11:00:00', 'disponibile'),
(9, '2025-02-02', '14:00:00', '16:00:00', 'disponibile'),
(9, '2025-02-04', '16:00:00', '18:00:00', 'disponibile'),
(9, '2025-02-06', '09:00:00', '11:00:00', 'disponibile'),
(9, '2025-02-08', '14:00:00', '16:00:00', 'disponibile'),
(9, '2025-02-10', '16:00:00', '18:00:00', 'disponibile');

-- Volontario 10 (Roberto Arancio)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
(10, '2025-01-28', '09:00:00', '11:00:00', 'disponibile'),
(10, '2025-01-30', '16:00:00', '18:00:00', 'disponibile'),
(10, '2025-02-01', '14:00:00', '16:00:00', 'disponibile'),
(10, '2025-02-03', '09:00:00', '11:00:00', 'disponibile'),
(10, '2025-02-05', '14:00:00', '16:00:00', 'disponibile'),
(10, '2025-02-07', '16:00:00', '18:00:00', 'disponibile'),
(10, '2025-02-09', '14:00:00', '16:00:00', 'disponibile'),
(10, '2025-02-11', '09:00:00', '11:00:00', 'disponibile');

-- Volontario 11 (Laura Grigio)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
(11, '2025-01-27', '16:00:00', '18:00:00', 'disponibile'),
(11, '2025-01-29', '09:00:00', '11:00:00', 'disponibile'),
(11, '2025-01-31', '14:00:00', '16:00:00', 'disponibile'),
(11, '2025-02-02', '16:00:00', '18:00:00', 'disponibile'),
(11, '2025-02-04', '09:00:00', '11:00:00', 'disponibile'),
(11, '2025-02-06', '14:00:00', '16:00:00', 'disponibile'),
(11, '2025-02-08', '16:00:00', '18:00:00', 'disponibile'),
(11, '2025-02-10', '09:00:00', '11:00:00', 'disponibile');

-- Verifica finale
SELECT 'Disponibilità create con successo!' as risultato;
SELECT COUNT(*) as totale_disponibilita_volontari FROM disponibilita WHERE volontario_id > 1; 