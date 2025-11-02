-- Script per aggiungere il campo telefono alla tabella volontari
-- Questo campo è opzionale per i contatti dei volontari

-- Aggiungi il campo telefono alla tabella volontari
ALTER TABLE volontari 
ADD COLUMN telefono VARCHAR(20);

-- Commento per documentare il campo
COMMENT ON COLUMN volontari.telefono IS 'Numero di telefono del volontario (opzionale)'; 