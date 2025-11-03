# 🧹 Guida: Pulizia Periodica delle Disponibilità

## Obiettivo

Rimuovere automaticamente le disponibilità ormai inutili (es. mesi già trascorsi) per mantenere il database snello e il front-end veloce.

## Script Disponibile

Lo script è già configurato e disponibile in `server/scripts/cleanup-disponibilita.js`.

### Modalità di esecuzione

| Comando | Effetto |
|---------|---------|
| `node server/scripts/cleanup-disponibilita.js` | Cancella disponibilità più vecchie di 120 giorni (default) |
| `node server/scripts/cleanup-disponibilita.js --days=90` | Cancella quelle più vecchie di 90 giorni |
| `npm run cleanup:disponibilita` | **Consigliato**: cancella tutto ciò che ha data precedente al primo giorno del mese corrente (elimina i mesi antecedenti) |

## Test Locale

Prima di schedulare, prova in locale:

```bash
# Assicurati di avere le variabili d'ambiente configurate
# (DATABASE_URL o DB_HOST, DB_PORT, ecc.)

# Esegui la pulizia "mesi precedenti" (consigliata)
npm run cleanup:disponibilita

# Oppure con giorni personalizzati
node server/scripts/cleanup-disponibilita.js --days=60
```

### Output atteso

```
🧹 Cleanup disponibilità: rimuovo tutte le voci con data precedente al 2025-11-01 (mesi antecedenti a quello corrente).
📊 Record da eliminare: 42
✅ Completato: 42 record eliminati.
```

## Automazione su Railway

Railway supporta **Cron Jobs** per eseguire comandi periodici.

### Configurazione Cron Job su Railway

1. Vai su **Railway Dashboard** → Il tuo progetto → **Settings**
2. Sezione **Cron Jobs** (o **Jobs**)
3. Crea un nuovo job con:
   - **Name**: `cleanup-disponibilita`
   - **Schedule**: `0 0 1 * *` (primo giorno del mese, ore 00:00)
   - **Command**: `npm run cleanup:disponibilita`
   - **Service**: Seleziona il servizio backend

### Spiegazione Schedule

- `0 0 1 * *` = ogni mese, giorno 1, ore 00:00
  - Prima cifra: minuti (0)
  - Seconda cifra: ore (0)
  - Terza cifra: giorno del mese (1)
  - Quarta cifra: mese (* = tutti)
  - Quinta cifra: giorno della settimana (* = tutti)

**Nota**: Railway potrebbe non supportare direttamente "ogni 40 giorni". La frequenza mensile è comunque adeguata per mantenere il database pulito.

## Alternative

### GitHub Actions

Crea `.github/workflows/cleanup.yml`:

```yaml
name: Cleanup Disponibilità

on:
  schedule:
    - cron: '0 0 1 * *'  # Primo giorno del mese

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Esegui cleanup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          cd server
          npm install
          npm run cleanup:disponibilita
```

### Cron Linux locale

Aggiungi a `crontab -e`:

```bash
0 0 1 * * cd /percorso/progetto/server && npm run cleanup:disponibilita
```

## Verifica

Dopo ogni esecuzione controlla:

1. **Log del job** (Railway → Logs) per messaggi di successo
2. **Conteggio record** nel database:
   ```sql
   SELECT COUNT(*) FROM disponibilita;
   ```
3. **Funzionalità applicazione**: verifica che le pagine "Disponibilità" e auto-compilazione funzionino correttamente

## Best Practices

✅ **Prima esecuzione manuale**: quando attivi il job, esegui manualmente `npm run cleanup:disponibilita` per pulire il database iniziale

✅ **Monitoraggio**: imposta notifiche (Railway, Slack) per job falliti

✅ **Backup preventivo**: se vuoi conservare un archivio, esporta le disponibilità vecchie prima di eliminarle

⚠️ **Limita inserimenti futuri**: considera di aggiungere nel backend un controllo che impedisca di inserire disponibilità troppo lontane (es. > 3 mesi avanti)

## Comandi Riepilogativi

```bash
# Pulizia manuale (default 120 giorni)
node server/scripts/cleanup-disponibilita.js

# Pulizia mesi precedenti (suggerita) – equivalente allo script npm
npm run cleanup:disponibilita

# oppure
node server/scripts/cleanup-disponibilita.js --before-current-month

# Personalizzata
node server/scripts/cleanup-disponibilita.js --days=90
```

## Risoluzione Problemi

**Errore: "ECONNREFUSED"**
- Verifica che `DATABASE_URL` sia configurata correttamente
- Controlla che il database sia accessibile dalla macchina che esegue lo script

**Nessun record eliminato**
- Verifica la data di cutoff con un log di debug
- Controlla che ci siano effettivamente record da eliminare:
  ```sql
  SELECT COUNT(*) FROM disponibilita WHERE data < '2025-11-01';
  ```

**Script non si chiude**
- Lo script chiude automaticamente la connessione al database
- Se il problema persiste, verifica che `db.$pool.end()` sia chiamato correttamente
