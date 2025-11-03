# ✅ Fix Upload Documenti su Railway

## Problema Risolto

**Errore:** `GET /api/documenti 500 (Internal Server Error)` in produzione

**Causa:** La tabella `documenti_autorizzazioni` non esisteva nel database Railway.

## Soluzioni Implementate

### 1. ✅ Creazione Tabella su Railway

- Eseguita migrazione per creare `documenti_autorizzazioni` su Railway
- Tabella verificata: 11 colonne create correttamente

### 2. ✅ Modifica Upload per Railway

**Problema:** Railway usa filesystem temporaneo, quindi i file caricati con `multer.diskStorage` vengono persi ad ogni deploy/restart.

**Soluzione:**
- **Produzione (Railway):** Usa `multer.memoryStorage()` e salva i file nel database come `BYTEA`
- **Locale:** Usa `multer.diskStorage()` e salva sul filesystem

### 3. ✅ Modifiche al Codice

**File modificati:**
- `server/routes/documenti.js`:
  - Rilevamento automatico ambiente (produzione vs locale)
  - Upload in memoria in produzione, su disco in locale
  - Salvataggio file nel database (colonna `file_data BYTEA`) in produzione
  - Download dal database in produzione, dal filesystem in locale

- `server/database/migrations/add_file_data_column.sql`:
  - Aggiunta colonna `file_data BYTEA` per salvare i file PDF

### 4. ✅ Migration Eseguita

La colonna `file_data` è stata aggiunta al database Railway.

## Come Funziona Ora

### In Produzione (Railway):
1. File caricato → salva in memoria (`req.file.buffer`)
2. File salvato nel database come `BYTEA` nella colonna `file_data`
3. Download: file recuperato dal database e inviato al client

### In Locale:
1. File caricato → salva sul filesystem (`server/uploads/documenti/`)
2. Path salvato nel database
3. Download: file letto dal filesystem e inviato al client

## Verifica

Dopo il deploy su Railway:

1. **Test GET /api/documenti:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://planner-turni-production.up.railway.app/api/documenti
   ```
   Dovrebbe restituire `200 OK` con lista documenti (anche vuota).

2. **Test Upload:**
   - Vai su Autorizzazioni
   - Clicca "Carica documento"
   - Seleziona un PDF
   - Il file dovrebbe essere caricato e salvato nel database

3. **Test Download:**
   - Clicca su un documento caricato
   - Il PDF dovrebbe aprirsi correttamente

## Note Importanti

- **Limite dimensione:** 10MB per PDF
- **Storage:** In produzione, i file occupano spazio nel database PostgreSQL
- **Performance:** Per file molto grandi, considera in futuro l'uso di S3 o servizi esterni

## Prossimi Passi

1. Verifica che `NODE_ENV=production` o `RAILWAY_ENVIRONMENT` sia settato su Railway
2. Testa l'upload di un documento in produzione
3. Verifica che il download funzioni correttamente

