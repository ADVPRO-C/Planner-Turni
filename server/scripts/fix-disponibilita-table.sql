-- Script per correggere la struttura della tabella disponibilita

-- Elimina la tabella esistente (è vuota, quindi sicuro)
DROP TABLE IF EXISTS disponibilita CASCADE;

-- Ricrea la tabella con la struttura corretta
CREATE TABLE disponibilita (
    id SERIAL PRIMARY KEY,
    volontario_id INTEGER REFERENCES volontari(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    orario_inizio TIME NOT NULL,
    orario_fine TIME NOT NULL,
    stato VARCHAR(20) DEFAULT 'disponibile' CHECK (stato IN ('disponibile', 'non_disponibile')),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(volontario_id, data, orario_inizio)
);

-- Ricrea l'indice
CREATE INDEX idx_disponibilita_volontario_data ON disponibilita(volontario_id, data);

-- Inserisci alcune disponibilità di test
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
(1, '2024-01-15', '09:00', '11:00', 'disponibile'),
(1, '2024-01-15', '14:00', '16:00', 'disponibile'),
(1, '2024-01-16', '09:00', '11:00', 'disponibile'),
(1, '2024-01-16', '14:00', '16:00', 'disponibile'),
(1, '2024-01-17', '09:00', '11:00', 'disponibile'),
(1, '2024-01-17', '14:00', '16:00', 'disponibile'),
(1, '2024-01-18', '09:00', '11:00', 'disponibile'),
(1, '2024-01-18', '14:00', '16:00', 'disponibile'),
(1, '2024-01-19', '09:00', '11:00', 'disponibile'),
(1, '2024-01-19', '14:00', '16:00', 'disponibile'),
(1, '2024-01-20', '09:00', '11:00', 'disponibile'),
(1, '2024-01-20', '14:00', '16:00', 'disponibile'),
(1, '2024-01-21', '09:00', '11:00', 'disponibile'),
(1, '2024-01-21', '14:00', '16:00', 'disponibile');

-- Verifica che tutto sia stato creato correttamente
SELECT 'Tabella disponibilita ricreata con successo' as status;
SELECT COUNT(*) as disponibilita_inserite FROM disponibilita; 