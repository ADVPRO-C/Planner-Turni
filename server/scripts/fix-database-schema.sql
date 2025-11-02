-- Script per correggere la struttura del database

-- Elimina le tabelle esistenti (sono vuote, quindi sicuro)
DROP TABLE IF EXISTS assegnazioni_volontari CASCADE;
DROP TABLE IF EXISTS assegnazioni CASCADE;
DROP TABLE IF EXISTS slot_orari CASCADE;
DROP TABLE IF EXISTS disponibilita CASCADE;
DROP TABLE IF EXISTS postazioni CASCADE;
DROP TABLE IF EXISTS notifiche CASCADE;

-- Ricrea la tabella postazioni con la struttura corretta
CREATE TABLE postazioni (
    id SERIAL PRIMARY KEY,
    luogo VARCHAR(255) NOT NULL,
    indirizzo TEXT,
    giorni_settimana INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Lunedì, 7=Domenica
    stato VARCHAR(20) DEFAULT 'attiva' CHECK (stato IN ('attiva', 'inattiva')),
    max_proclamatori INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ricrea la tabella slot orari
CREATE TABLE slot_orari (
    id SERIAL PRIMARY KEY,
    postazione_id INTEGER REFERENCES postazioni(id) ON DELETE CASCADE,
    orario_inizio TIME NOT NULL,
    orario_fine TIME NOT NULL,
    max_volontari INTEGER DEFAULT 3,
    stato VARCHAR(20) DEFAULT 'attivo' CHECK (stato IN ('attivo', 'inattivo')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(postazione_id, orario_inizio, orario_fine)
);

-- Ricrea la tabella disponibilita
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

-- Ricrea la tabella assegnazioni
CREATE TABLE assegnazioni (
    id SERIAL PRIMARY KEY,
    postazione_id INTEGER REFERENCES postazioni(id) ON DELETE CASCADE,
    slot_orario_id INTEGER REFERENCES slot_orari(id) ON DELETE CASCADE,
    data_turno DATE NOT NULL,
    stato VARCHAR(20) DEFAULT 'assegnato' CHECK (stato IN ('assegnato', 'completato', 'cancellato')),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ricrea la tabella di collegamento tra assegnazioni e volontari
CREATE TABLE assegnazioni_volontari (
    id SERIAL PRIMARY KEY,
    assegnazione_id INTEGER REFERENCES assegnazioni(id) ON DELETE CASCADE,
    volontario_id INTEGER REFERENCES volontari(id) ON DELETE CASCADE,
    ruolo_turno VARCHAR(50) DEFAULT 'volontario',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assegnazione_id, volontario_id)
);

-- Ricrea la tabella notifiche
CREATE TABLE notifiche (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    titolo VARCHAR(255) NOT NULL,
    messaggio TEXT NOT NULL,
    destinatario_id INTEGER REFERENCES volontari(id) ON DELETE CASCADE,
    letta BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ricrea gli indici
CREATE INDEX idx_disponibilita_volontario_data ON disponibilita(volontario_id, data);
CREATE INDEX idx_assegnazioni_data ON assegnazioni(data_turno);
CREATE INDEX idx_assegnazioni_postazione ON assegnazioni(postazione_id);
CREATE INDEX idx_slot_orari_postazione ON slot_orari(postazione_id);
CREATE INDEX idx_volontari_stato ON volontari(stato);
CREATE INDEX idx_volontari_sesso ON volontari(sesso);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_volontari_updated_at BEFORE UPDATE ON volontari
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_postazioni_updated_at BEFORE UPDATE ON postazioni
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slot_orari_updated_at BEFORE UPDATE ON slot_orari
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assegnazioni_updated_at BEFORE UPDATE ON assegnazioni
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserisci dati di test

-- 1. Inserisci postazioni di test
INSERT INTO postazioni (luogo, indirizzo, giorni_settimana, stato, max_proclamatori) VALUES
('Piazza del Duomo', 'Via Roma 1, Milano', '{1,2,3,4,5}', 'attiva', 3),
('Galleria Vittorio Emanuele', 'Piazza del Duomo, Milano', '{1,2,3,4,5,6}', 'attiva', 2),
('Parco Sempione', 'Via Pagano, Milano', '{6,7}', 'attiva', 3);

-- 2. Inserisci slot orari per le postazioni
INSERT INTO slot_orari (postazione_id, orario_inizio, orario_fine, max_volontari) VALUES
(1, '09:00', '11:00', 3),
(1, '14:00', '16:00', 3),
(1, '16:00', '18:00', 3),
(2, '10:00', '12:00', 2),
(2, '15:00', '17:00', 2),
(3, '10:00', '12:00', 3),
(3, '15:00', '17:00', 3);

-- 3. Inserisci disponibilità di test per le date corrette (2025)
INSERT INTO disponibilita (volontario_id, data, orario_inizio, orario_fine, stato) VALUES
-- Disponibilità per il volontario 1
(1, '2025-01-27', '09:00', '11:00', 'disponibile'),
(1, '2025-01-27', '14:00', '16:00', 'disponibile'),
(1, '2025-01-27', '16:00', '18:00', 'disponibile'),
(1, '2025-01-28', '09:00', '11:00', 'disponibile'),
(1, '2025-01-28', '14:00', '16:00', 'disponibile'),
(1, '2025-01-28', '16:00', '18:00', 'disponibile'),
(1, '2025-01-29', '09:00', '11:00', 'disponibile'),
(1, '2025-01-29', '14:00', '16:00', 'disponibile'),
(1, '2025-01-29', '16:00', '18:00', 'disponibile'),
(1, '2025-01-30', '09:00', '11:00', 'disponibile'),
(1, '2025-01-30', '14:00', '16:00', 'disponibile'),
(1, '2025-01-30', '16:00', '18:00', 'disponibile'),
(1, '2025-01-31', '09:00', '11:00', 'disponibile'),
(1, '2025-01-31', '14:00', '16:00', 'disponibile'),
(1, '2025-01-31', '16:00', '18:00', 'disponibile'),
(1, '2025-02-01', '09:00', '11:00', 'disponibile'),
(1, '2025-02-01', '14:00', '16:00', 'disponibile'),
(1, '2025-02-01', '16:00', '18:00', 'disponibile'),
(1, '2025-02-02', '10:00', '12:00', 'disponibile'),
(1, '2025-02-02', '15:00', '17:00', 'disponibile'),
(1, '2025-02-03', '10:00', '12:00', 'disponibile'),
(1, '2025-02-03', '15:00', '17:00', 'disponibile');

-- Verifica che tutto sia stato creato correttamente
SELECT 'Database aggiornato con successo' as status;
SELECT COUNT(*) as postazioni_inserite FROM postazioni;
SELECT COUNT(*) as slot_orari_inseriti FROM slot_orari;
SELECT COUNT(*) as disponibilita_inserite FROM disponibilita; 