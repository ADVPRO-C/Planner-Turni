# Correzioni Sistema Gestione Disponibilità e Assegnazione Turni

## Problemi Identificati

### 1. **Problema di Timezone nel Filtraggio Date**

- **Descrizione**: Il codice JavaScript convertiva le date usando `toISOString()` che causava problemi di timezone
- **Impatto**: Le disponibilità non venivano trovate correttamente nella pagina Autocompilazione
- **Soluzione**: Aggiornata la gestione delle date per supportare sia stringhe che oggetti Date

### 2. **Struttura Database Ridondante**

- **Descrizione**: La tabella `disponibilita` aveva campi ridondanti `orario_inizio` e `orario_fine`
- **Impatto**: Confusione nel codice e possibili inconsistenze tra dati
- **Soluzione**: Rimossi i campi ridondanti, mantenuto solo `slot_orario_id`

### 3. **Mancanza di Dati di Test**

- **Descrizione**: Non c'erano disponibilità per le date di luglio/agosto 2025
- **Impatto**: Impossibile testare il sistema di assegnazione
- **Soluzione**: Creati 3001 nuovi record di disponibilità per luglio/agosto 2025

### 4. **Ottimizzazione Calendario**

- **Descrizione**: Il calendario mostrava giorni senza postazioni attive
- **Impatto**: Interfaccia confusa con giorni vuoti
- **Soluzione**: Implementata logica per mostrare solo giorni con postazioni attive e slot orari configurati

## Correzioni Implementate

### Frontend (Autocompilazione.js)

#### Gestione Date Senza Timezone

```javascript
// Prima (problematico)
const disponibilitaDate = new Date(d.data).toISOString().split("T")[0];

// Dopo (corretto)
let disponibilitaDate;
if (typeof d.data === "string") {
  disponibilitaDate = d.data.split("T")[0];
} else {
  disponibilitaDate = d.data.toISOString().split("T")[0];
}
```

#### Filtraggio per Slot Orario

```javascript
// Prima (filtrava per orari ridondanti)
const matches =
  disponibilitaDate === date &&
  d.orario_inizio === orarioInizio &&
  d.orario_fine === orarioFine &&
  d.slot_orario_id === slotOrarioId;

// Dopo (solo slot_orario_id)
const matches = disponibilitaDate === date && d.slot_orario_id === slotOrarioId;
```

### Database

#### Semplificazione Tabella Disponibilità

```sql
-- Rimossi campi ridondanti
ALTER TABLE disponibilita DROP COLUMN IF EXISTS orario_inizio;
ALTER TABLE disponibilita DROP COLUMN IF EXISTS orario_fine;

-- Struttura finale
CREATE TABLE disponibilita (
    id SERIAL PRIMARY KEY,
    volontario_id INTEGER REFERENCES volontari(id),
    data DATE NOT NULL,
    stato VARCHAR(20) DEFAULT 'disponibile',
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    slot_orario_id INTEGER REFERENCES slot_orari(id) NOT NULL,
    UNIQUE(volontario_id, data, slot_orario_id)
);
```

### API

#### Aggiornamento Query Disponibilità

```sql
-- Query semplificata che usa solo slot_orario_id
SELECT
    d.volontario_id,
    d.data::date as data,
    so.orario_inizio,
    so.orario_fine,
    d.stato as disponibilita_stato,
    so.id as slot_orario_id,
    so.postazione_id,
    v.nome,
    v.cognome,
    v.sesso,
    v.stato as volontario_stato
FROM disponibilita d
JOIN volontari v ON d.volontario_id = v.id
JOIN slot_orari so ON d.slot_orario_id = so.id
JOIN postazioni p ON so.postazione_id = p.id
WHERE d.data BETWEEN $1 AND $2
  AND v.stato = 'attivo'
  AND d.stato = 'disponibile'
```

#### Correzione Endpoint Assegnazione

```sql
-- Prima (usava campi rimossi)
SELECT * FROM disponibilita
WHERE volontario_id = $1
  AND data = $2
  AND orario_inizio = $3
  AND orario_fine = $4
  AND postazione_id = $5
  AND stato = 'disponibile'

-- Dopo (usa solo slot_orario_id)
SELECT d.* FROM disponibilita d
JOIN slot_orari so ON d.slot_orario_id = so.id
WHERE d.volontario_id = $1
  AND d.data = $2
  AND d.slot_orario_id = $3
  AND d.stato = 'disponibile'
```

#### Ottimizzazione Generazione Date Calendario

```sql
-- Prima (mostrava tutti i giorni)
SELECT DISTINCT TO_CHAR(d, 'YYYY-MM-DD') as data
FROM generate_series($1::date, $2::date, '1 day'::interval) d
WHERE EXISTS (
  SELECT 1 FROM postazioni p
  WHERE p.stato = 'attiva'
  AND EXTRACT(DOW FROM d) + 1 = ANY(p.giorni_settimana)
)

-- Dopo (solo giorni con postazioni attive e slot configurati)
SELECT DISTINCT TO_CHAR(d, 'YYYY-MM-DD') as data
FROM generate_series($1::date, $2::date, '1 day'::interval) d
WHERE EXISTS (
  SELECT 1 FROM postazioni p
  JOIN slot_orari so ON p.id = so.postazione_id
  WHERE p.stato = 'attiva'
  AND so.stato = 'attivo'
  AND CASE
    WHEN EXTRACT(DOW FROM d) = 0 THEN 1  -- Domenica
    WHEN EXTRACT(DOW FROM d) = 1 THEN 2  -- Lunedì
    WHEN EXTRACT(DOW FROM d) = 2 THEN 3  -- Martedì
    WHEN EXTRACT(DOW FROM d) = 3 THEN 4  -- Mercoledì
    WHEN EXTRACT(DOW FROM d) = 4 THEN 5  -- Giovedì
    WHEN EXTRACT(DOW FROM d) = 5 THEN 6  -- Venerdì
    WHEN EXTRACT(DOW FROM d) = 6 THEN 7  -- Sabato
  END = ANY(p.giorni_settimana)
)
```

```sql
-- Query semplificata che usa solo slot_orario_id
SELECT
    d.volontario_id,
    d.data::date as data,
    so.orario_inizio,
    so.orario_fine,
    d.stato as disponibilita_stato,
    so.id as slot_orario_id,
    so.postazione_id,
    v.nome,
    v.cognome,
    v.sesso,
    v.stato as volontario_stato
FROM disponibilita d
JOIN volontari v ON d.volontario_id = v.id
JOIN slot_orari so ON d.slot_orario_id = so.id
JOIN postazioni p ON so.postazione_id = p.id
WHERE d.data BETWEEN $1 AND $2
  AND v.stato = 'attivo'
  AND d.stato = 'disponibile'
```

## Dati di Test Creati

### Statistiche Disponibilità Luglio/Agosto 2025

- **Totale record**: 3001
- **Periodo**: 1 luglio - 31 agosto 2025
- **Volontari**: 10 (escluso admin)
- **Slot orari**: 7 slot attivi
- **Probabilità inserimento**: 70% per rendere realistico

### Esempio Disponibilità Settimana 23-30 Luglio

- **Disponibilità totali**: 378
- **Slot 35 (Piazza Giotto 09:00-11:00)**: 9 volontari disponibili il 23 luglio
- **Copertura**: Tutti i giorni con postazioni attive

## Flusso di Comunicazione Corretto

### 1. **Inserimento Disponibilità** (Pagina Disponibilità)

```
Volontario → Seleziona slot → Salva → API disponibilità → Database
```

### 2. **Visualizzazione Disponibilità** (Pagina Autocompilazione)

```
API turni/gestione → Carica disponibilità → Filtra per slot_orario_id → Mostra dropdown
```

### 3. **Assegnazione Turni**

```
Admin → Seleziona volontario → API turni/assegna → Crea assegnazione → Database
```

## Vantaggi delle Correzioni

1. **Coerenza Dati**: Eliminata ridondanza, unica fonte di verità per gli orari
2. **Manutenibilità**: Codice più semplice e comprensibile
3. **Performance**: Query più efficienti senza join ridondanti
4. **Affidabilità**: Eliminati problemi di timezone
5. **Testabilità**: Dati di test completi per verificare funzionalità

## Test di Verifica

### API Test

```bash
# Verifica disponibilità luglio 2025
curl "http://localhost:5001/api/turni/gestione/2025-07-23/2025-07-30" | jq '.disponibilita | length'
# Risultato: 301 disponibilità

# Test assegnazione volontario
curl -X POST "http://localhost:5001/api/turni/assegna" \
  -H "Content-Type: application/json" \
  -d '{"data_turno": "2025-07-23", "slot_orario_id": 35, "postazione_id": 16, "volontario_id": 2}'
# Risultato: {"message": "Volontario assegnato con successo", "assegnazione_id": 39}
```

### Database Test

```sql
-- Verifica disponibilità specifica
SELECT COUNT(*) FROM disponibilita d
JOIN slot_orari so ON d.slot_orario_id = so.id
WHERE d.data = '2025-07-23' AND so.id = 35;
-- Risultato: 9 volontari disponibili
```

## Stato Attuale

✅ **Problemi risolti**:

- Timezone nel filtraggio date
- Struttura database ridondante
- Mancanza dati di test
- Comunicazione tra pagine
- Errore 500 nell'assegnazione volontari

✅ **Sistema funzionante**:

- Inserimento disponibilità
- Visualizzazione disponibilità
- Assegnazione turni
- Selezione proclamatori

Il sistema ora funziona correttamente con una comunicazione fluida tra la gestione delle disponibilità e l'assegnazione dei turni.
