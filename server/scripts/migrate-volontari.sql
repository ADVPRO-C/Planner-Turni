-- Script per migrare la tabella volontari alla struttura corretta
-- Prima salviamo i dati esistenti

-- Creiamo una tabella temporanea con i dati esistenti
CREATE TABLE IF NOT EXISTS volontari_temp AS 
SELECT * FROM volontari;

-- Eliminiamo la tabella volontari esistente
DROP TABLE IF EXISTS volontari CASCADE;

-- Ricreiamo la tabella volontari con la struttura corretta
CREATE TABLE IF NOT EXISTS volontari (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cognome VARCHAR(100) NOT NULL,
    sesso CHAR(1) NOT NULL CHECK (sesso IN ('M', 'F')),
    stato VARCHAR(20) DEFAULT 'attivo' CHECK (stato IN ('attivo', 'non_attivo')),
    ultima_assegnazione TIMESTAMP,
    email VARCHAR(255) UNIQUE,
    telefono VARCHAR(20),
    password_hash VARCHAR(255),
    ruolo VARCHAR(20) DEFAULT 'volontario' CHECK (ruolo IN ('volontario', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migriamo i dati dalla tabella temporanea
INSERT INTO volontari (id, nome, cognome, sesso, stato, ultima_assegnazione, created_at, updated_at)
SELECT 
    id::integer,
    nome,
    cognome,
    CASE 
        WHEN sesso = 'M' THEN 'M'
        WHEN sesso = 'F' THEN 'F'
        ELSE 'M' -- default
    END,
    CASE 
        WHEN stato = true THEN 'attivo'
        ELSE 'non_attivo'
    END,
    ultima_assegnazione,
    created_at,
    updated_at
FROM volontari_temp;

-- Aggiungiamo un admin di default se non esiste
INSERT INTO volontari (nome, cognome, sesso, stato, email, password_hash, ruolo)
VALUES ('Admin', 'Sistema', 'M', 'attivo', 'admin@planner.com', '$2b$10$default_hash_here', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Eliminiamo la tabella temporanea
DROP TABLE IF EXISTS volontari_temp;

-- Ricreiamo gli indici
CREATE INDEX IF NOT EXISTS idx_volontari_stato ON volontari(stato);
CREATE INDEX IF NOT EXISTS idx_volontari_sesso ON volontari(sesso);

-- Ricreiamo il trigger per updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_volontari_updated_at BEFORE UPDATE ON volontari
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 