# Migrazione Database Locale → Railway

## Situazione

✅ **Database Locale** (localhost) contiene i dati reali:
- 2 congregazioni
- 35 volontari
- 3 postazioni
- 173 disponibilità
- 53 assegnazioni

## Procedura di Migrazione

### 1. Verifica connessione Railway

Assicurati di avere la `RAILWAY_DATABASE_URL` configurata:

```bash
export RAILWAY_DATABASE_URL="postgresql://postgres:vyiPjmjNpiYugHWGFmtSXCKMImXVpHDV@ballast.proxy.rlwy.net:30883/railway"
```

### 2. Esegui la migrazione

```bash
cd server
npm run migrate:localhost-to-railway
```

Oppure direttamente:

```bash
cd server
RAILWAY_DATABASE_URL="postgresql://postgres:vyiPjmjNpiYugHWGFmtSXCKMImXVpHDV@ballast.proxy.rlwy.net:30883/railway" node scripts/migrate-localhost-to-railway.js
```

### 3. Verifica i risultati

Lo script mostrerà:
- ✅ Record migrati per tabella
- 📊 Riepilogo finale
- ❌ Eventuali errori

## Note

- Lo script usa `ON CONFLICT DO NOTHING`, quindi se esegui la migrazione più volte, non creerà duplicati
- Le foreign keys vengono temporaneamente disabilitate durante l'inserimento per migliorare le performance
- L'ordine delle tabelle rispetta le dipendenze (congregazioni → volontari → postazioni → etc.)

## Alternative

Se preferisci un approccio più manuale:

```bash
# Export dal database locale
pg_dump -h localhost -U zy0n -d planner_db --data-only --no-owner --no-acl > local_db_export.sql

# Import in Railway
psql "postgresql://postgres:vyiPjmjNpiYugHWGFmtSXCKMImXVpHDV@ballast.proxy.rlwy.net:30883/railway" < local_db_export.sql
```

