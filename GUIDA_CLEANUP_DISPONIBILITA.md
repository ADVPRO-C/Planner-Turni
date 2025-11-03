# 🧹 Guida: Pulizia Manuale delle Disponibilità

## Obiettivo

Rimuovere manualmente le disponibilità ormai inutili (es. mesi già trascorsi) per mantenere il database snello e il front-end veloce.

## Script Disponibile

Lo script è disponibile in `server/scripts/cleanup-disponibilita.js` per esecuzione manuale.

### Modalità di esecuzione

| Comando | Effetto |
|---------|---------|
| `node server/scripts/cleanup-disponibilita.js` | Cancella disponibilità più vecchie di 120 giorni (default) |
| `node server/scripts/cleanup-disponibilita.js --days=90` | Cancella quelle più vecchie di 90 giorni |
| `node server/scripts/cleanup-disponibilita.js --before-current-month` | Cancella tutto ciò che ha data precedente al primo giorno del mese corrente (elimina i mesi antecedenti) |

## Esecuzione Manuale

Esegui lo script manualmente quando necessario:

```bash
# Assicurati di avere le variabili d'ambiente configurate
# (DATABASE_URL o DB_HOST, DB_PORT, ecc.)

# Esegui la pulizia "mesi precedenti" (consigliata)
node server/scripts/cleanup-disponibilita.js --before-current-month

# Oppure con giorni personalizzati
node server/scripts/cleanup-disponibilita.js --days=60
```

### Output atteso

```
🧹 Cleanup disponibilità: rimuovo tutte le voci con data precedente al 2025-11-01 (mesi antecedenti a quello corrente).
📊 Record da eliminare: 42
✅ Completato: 42 record eliminati.
```

## Verifica

Dopo ogni esecuzione controlla:

1. **Output dello script** per vedere quanti record sono stati eliminati
2. **Conteggio record** nel database:
   ```sql
   SELECT COUNT(*) FROM disponibilita;
   ```
3. **Funzionalità applicazione**: verifica che le pagine "Disponibilità" e auto-compilazione funzionino correttamente

## Best Practices

✅ **Backup preventivo**: se vuoi conservare un archivio, esporta le disponibilità vecchie prima di eliminarle

✅ **Esecuzione periodica**: considera di eseguire lo script manualmente ogni mese o quando necessario

⚠️ **Limita inserimenti futuri**: considera di aggiungere nel backend un controllo che impedisca di inserire disponibilità troppo lontane (es. > 3 mesi avanti)

## Comandi Riepilogativi

```bash
# Pulizia manuale (default 120 giorni)
node server/scripts/cleanup-disponibilita.js

# Pulizia mesi precedenti (suggerita)
node server/scripts/cleanup-disponibilita.js --before-current-month

# Personalizzata (es. 90 giorni)
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
