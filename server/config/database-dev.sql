BEGIN;

TRUNCATE TABLE
    assegnazioni_volontari,
    assegnazioni,
    disponibilita,
    slot_orari,
    postazioni,
    volontari,
    congregazioni
RESTART IDENTITY CASCADE;

-- Congregazioni di esempio
INSERT INTO congregazioni (id, codice, nome)
VALUES
    (1, '001', 'Palermo Uditore'),
    (2, '002', 'Palermo Borgo Nuovo');

SELECT pg_catalog.setval('public.congregazioni_id_seq', (SELECT MAX(id) FROM congregazioni), true);

-- Utenti e ruoli
INSERT INTO volontari (
    id,
    congregazione_id,
    nome,
    cognome,
    sesso,
    stato,
    email,
    telefono,
    password_hash,
    ruolo
) VALUES
    (1, 1, 'Davide', 'Arena', 'M', 'attivo', 'admin@planner.com', '3330001111', '$2a$10$3Zp3phJMV8owZlZRnaHdxOyV1p8as5eb5DgQWe2Us5FL/Ip.Rrj4m', 'super_admin'),
    (2, 1, 'Mario', 'Rossi', 'M', 'attivo', 'mario.rossi@planner.com', '3331112222', '$2a$10$3Zp3phJMV8owZlZRnaHdxOyV1p8as5eb5DgQWe2Us5FL/Ip.Rrj4m', 'admin'),
    (3, 1, 'Luca', 'Verdi', 'M', 'attivo', 'luca.verdi@planner.com', '3332223333', '$2a$10$3Zp3phJMV8owZlZRnaHdxOyV1p8as5eb5DgQWe2Us5FL/Ip.Rrj4m', 'volontario'),
    (4, 2, 'Marta', 'Bianchi', 'F', 'attivo', 'marta.bianchi@planner.com', '3334445555', '$2a$10$3Zp3phJMV8owZlZRnaHdxOyV1p8as5eb5DgQWe2Us5FL/Ip.Rrj4m', 'admin'),
    (5, 2, 'Giulia', 'Neri', 'F', 'attivo', 'giulia.neri@planner.com', '3335556666', '$2a$10$3Zp3phJMV8owZlZRnaHdxOyV1p8as5eb5DgQWe2Us5FL/Ip.Rrj4m', 'volontario');

SELECT pg_catalog.setval('public.volontari_id_seq', (SELECT MAX(id) FROM volontari), true);

-- Postazioni
INSERT INTO postazioni (
    id,
    congregazione_id,
    luogo,
    indirizzo,
    giorni_settimana,
    stato,
    max_proclamatori
) VALUES
    (1, 1, 'Piazza Uditore', 'Piazza Uditore, Palermo', ARRAY[1,2,3,4,5,6], 'attiva', 3),
    (2, 1, 'Conca d''Oro', 'Centro Commerciale Conca d''Oro, Palermo', ARRAY[5,6], 'attiva', 2),
    (3, 2, 'Piazza Borgo Nuovo', 'Piazza Borgo Nuovo, Palermo', ARRAY[3,4,6], 'attiva', 3);

SELECT pg_catalog.setval('public.postazioni_id_seq', (SELECT MAX(id) FROM postazioni), true);

-- Slot orari
INSERT INTO slot_orari (
    id,
    postazione_id,
    congregazione_id,
    orario_inizio,
    orario_fine,
    max_volontari,
    stato
) VALUES
    (1, 1, 1, '09:00:00', '11:00:00', 2, 'attivo'),
    (2, 1, 1, '16:00:00', '18:00:00', 2, 'attivo'),
    (3, 2, 1, '10:00:00', '12:00:00', 2, 'attivo'),
    (4, 3, 2, '09:30:00', '11:30:00', 3, 'attivo');

SELECT pg_catalog.setval('public.slot_orari_id_seq', (SELECT MAX(id) FROM slot_orari), true);

-- Disponibilità
INSERT INTO disponibilita (
    id,
    volontario_id,
    congregazione_id,
    data,
    stato,
    note,
    slot_orario_id
) VALUES
    (1, 3, 1, '2025-08-01', 'disponibile', 'Disponibile mattina', 1),
    (2, 3, 1, '2025-08-02', 'disponibile', 'Disponibile pomeriggio', 2),
    (3, 5, 2, '2025-08-02', 'disponibile', 'Disponibile turno mattina', 4);

SELECT pg_catalog.setval('public.disponibilita_id_seq', (SELECT MAX(id) FROM disponibilita), true);

-- Assegnazioni
INSERT INTO assegnazioni (
    id,
    postazione_id,
    congregazione_id,
    slot_orario_id,
    data_turno,
    stato,
    note
) VALUES
    (1, 1, 1, 1, '2025-08-01', 'assegnato', 'Turno mattina Uditore'),
    (2, 3, 2, 4, '2025-08-02', 'assegnato', 'Turno piazza Borgo Nuovo');

SELECT pg_catalog.setval('public.assegnazioni_id_seq', (SELECT MAX(id) FROM assegnazioni), true);

-- Assegnazioni volontari
INSERT INTO assegnazioni_volontari (
    id,
    assegnazione_id,
    volontario_id,
    congregazione_id,
    ruolo_turno
) VALUES
    (1, 1, 2, 1, 'coordinatore'),
    (2, 1, 3, 1, 'volontario'),
    (3, 2, 4, 2, 'coordinatore'),
    (4, 2, 5, 2, 'volontario');

SELECT pg_catalog.setval('public.assegnazioni_volontari_id_seq', (SELECT MAX(id) FROM assegnazioni_volontari), true);

COMMIT;
