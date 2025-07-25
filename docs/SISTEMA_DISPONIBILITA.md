# Sistema di Gestione Disponibilità e Autocompilazione Turni

## Panoramica

Il sistema di gestione disponibilità permette ai proclamatori di inserire le loro disponibilità settimanali/mensili e all'amministratore di utilizzare un algoritmo di autocompilazione per assegnare automaticamente i turni.

## Funzionalità Principali

### 1. Gestione Disponibilità Proclamatori

#### Pagina: `/volontari/disponibilita`

- **Accesso**: Tutti i proclamatori
- **Funzionalità**:
  - Visualizzazione calendario trimestrale
  - Selezione disponibilità tramite checkbox per ogni slot orario
  - Filtro per postazioni e giorni della settimana
  - Salvataggio delle disponibilità con conferma
  - Visualizzazione delle date passate (non modificabili)

#### Caratteristiche:

- **Calendario Trimestrale**: Navigazione tra i trimestri dell'anno
- **Slot Orari**: Checkbox per ogni slot orario disponibile
- **Validazione**: Le date passate non possono essere modificate
- **Persistenza**: Le disponibilità vengono salvate nel database

### 2. Riepilogo Disponibilità (Admin)

#### Pagina: `/volontari/riepilogo-disponibilita`

- **Accesso**: Solo amministratori
- **Funzionalità**:
  - Panoramica delle disponibilità per periodo
  - Statistiche sui slot disponibili
  - Filtri per data e stato
  - Flag di attenzione per slot senza uomini

#### Statistiche Visualizzate:

- **Totale Slot**: Numero totale di slot disponibili
- **Sufficienti**: Slot con almeno 1 uomo disponibile
- **Attenzione**: Slot senza uomini disponibili
- **Critici**: Slot non assegnabili

### 3. Autocompilazione Turni (Admin)

#### Pagina: `/turni/autocompilazione`

- **Accesso**: Solo amministratori
- **Funzionalità**:
  - Esecuzione algoritmo di autocompilazione
  - Visualizzazione risultati in tempo reale
  - Statistiche sui turni assegnati
  - Filtri per visualizzare solo slot non assegnati

#### Algoritmo di Autocompilazione:

1. **Priorità 1**: Assegna almeno 1 uomo per turno (se disponibile)
2. **Priorità 2**: Completa con altri volontari disponibili
3. **Rispetto Limiti**: Rispetta i limiti massimi di volontari per slot
4. **Flag Attenzione**: Segnala slot senza uomini ma permette l'assegnazione

## Struttura Database

### Tabella `disponibilita`

```sql
CREATE TABLE disponibilita (
    id SERIAL PRIMARY KEY,
    volontario_id INTEGER REFERENCES volontari(id),
    data DATE NOT NULL,
    orario_inizio TIME NOT NULL,
    orario_fine TIME NOT NULL,
    stato VARCHAR(20) DEFAULT 'disponibile',
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relazioni

- `disponibilita.volontario_id` → `volontari.id`
- `disponibilita` ↔ `slot_orari` (per orari e postazioni)
- `disponibilita` ↔ `assegnazioni` (per turni assegnati)

## API Endpoints

### Disponibilità Volontari

- `GET /api/disponibilita/volontario/:id` - Ottieni disponibilità di un volontario
- `POST /api/disponibilita/volontario` - Salva disponibilità di un volontario
- `DELETE /api/disponibilita/volontario/:id` - Elimina disponibilità

### Riepilogo e Gestione

- `GET /api/disponibilita/riepilogo` - Riepilogo disponibilità per periodo
- `GET /api/disponibilita/postazione/:id` - Disponibilità per postazione specifica

### Autocompilazione

- `POST /api/turni/autocompilazione` - Esegue autocompilazione turni

## Flusso di Utilizzo

### Per i Proclamatori:

1. **Accesso**: Login con credenziali personali
2. **Navigazione**: Menu → Proclamatori → Disponibilità
3. **Selezione**: Checkbox per slot orari desiderati
4. **Conferma**: Clic su "Conferma Disponibilità"
5. **Verifica**: Le disponibilità vengono salvate e sono visibili all'admin

### Per l'Amministratore:

1. **Riepilogo**: Menu → Proclamatori → Riepilogo Disponibilità
2. **Analisi**: Verifica delle disponibilità e slot con attenzione
3. **Autocompilazione**: Menu → Gestione Turni → Autocompilazione
4. **Esecuzione**: Clic su "Avvia Autocompilazione"
5. **Verifica**: Controllo dei risultati e turni assegnati

## Regole di Business

### Requisiti Uomini per Turno

- **Obbligatorio**: Almeno 1 uomo per turno (preferenza)
- **Gestione**: Se non disponibile, viene segnalato un flag di attenzione
- **Autocompilazione**: Funziona anche senza uomini ma con avviso

### Limiti Volontari

- **Per Slot**: Rispetta `slot_orari.max_volontari`
- **Per Postazione**: Rispetta `postazioni.max_proclamatori`
- **Algoritmo**: Assegna fino al limite minimo tra i due

### Priorità Assegnazione

1. **Uomini Disponibili**: Priorità massima
2. **Donne Disponibili**: Priorità secondaria
3. **Bilanciamento**: Distribuzione equa tra volontari

## Sicurezza e Permessi

### Accesso Volontari

- Possono vedere solo le proprie disponibilità
- Possono modificare solo le proprie disponibilità
- Non possono vedere disponibilità di altri volontari

### Accesso Amministratore

- Visualizzazione completa di tutte le disponibilità
- Esecuzione autocompilazione
- Gestione turni e assegnazioni
- Accesso a statistiche e report

## Monitoraggio e Reporting

### Statistiche Disponibili

- **Slot Totali**: Numero totale di slot configurati
- **Slot Assegnati**: Numero di slot con turni assegnati
- **Slot Attenzione**: Numero di slot senza uomini
- **Slot Critici**: Numero di slot non assegnabili

### Flag di Attenzione

- **Giallo**: Slot senza uomini disponibili
- **Verde**: Slot con almeno 1 uomo
- **Rosso**: Slot non assegnabili (nessun volontario)

## Manutenzione e Aggiornamenti

### Backup Dati

- Le disponibilità vengono salvate con timestamp
- Possibilità di ripristino da backup
- Storico delle modifiche mantenuto

### Aggiornamenti Sistema

- Compatibilità con versioni precedenti
- Migrazione automatica dei dati
- Preservazione delle configurazioni esistenti

## Troubleshooting

### Problemi Comuni

1. **Disponibilità non salvate**: Verificare connessione e permessi
2. **Autocompilazione fallita**: Controllare disponibilità e configurazioni
3. **Slot non assegnati**: Verificare limiti e disponibilità volontari

### Log e Debug

- Log dettagliati delle operazioni
- Tracciamento errori per debugging
- Notifiche in tempo reale per problemi critici
