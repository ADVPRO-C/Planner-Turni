-- Script per inserire i volontari nel database centralizzato
-- Inserimento volontari di esempio

INSERT INTO volontari (nome, cognome, sesso, email, telefono, stato) VALUES
('Mario', 'Rossi', 'M', 'mario.rossi@email.com', '3331234567', 'attivo'),
('Giulia', 'Bianchi', 'F', 'giulia.bianchi@email.com', '3332345678', 'attivo'),
('Luca', 'Verdi', 'M', 'luca.verdi@email.com', '3333456789', 'attivo'),
('Anna', 'Neri', 'F', 'anna.neri@email.com', '3334567890', 'attivo'),
('Marco', 'Gialli', 'M', 'marco.gialli@email.com', '3335678901', 'attivo'),
('Sofia', 'Rosa', 'F', 'sofia.rosa@email.com', '3336789012', 'attivo'),
('Paolo', 'Blu', 'M', 'paolo.blu@email.com', '3337890123', 'attivo'),
('Elena', 'Viola', 'F', 'elena.viola@email.com', '3338901234', 'attivo'),
('Roberto', 'Arancio', 'M', 'roberto.arancio@email.com', '3339012345', 'attivo'),
('Laura', 'Grigio', 'F', 'laura.grigio@email.com', '3330123456', 'attivo');

-- Aggiorna le sequenze
SELECT setval('volontari_id_seq', (SELECT MAX(id) FROM volontari)); 