# Soluzione Migrazione Dati

## Stato Attuale

✅ **Completato:**
- Schema database Railway inizializzato
- Script di migrazione via REST API creato
- Connessione Railway funzionante

❌ **Problema:**
- Alcune tabelle Supabase **non sono esposte via PostgREST REST API**
- Tabelle accessibili: `postazioni`, `disponibilita`, `assegnazioni` (ma risultano vuote)
- Tabelle NON accessibili: `congregazioni`, `volontari`, `slot_orari`, `assegnazioni_volontari`, `notifiche`, `notifications`

## Soluzioni Disponibili

### Opzione 1: Backup SQL di Supabase (CONSIGLIATO) ⭐

1. Vai su **Supabase Dashboard** → **Database** → **Backups**
2. Scarica il backup SQL più recente
3. Importa il backup in Railway:

```bash
# Importa il backup SQL in Railway
psql "postgresql://postgres:vyiPjmjNpiYugHWGFmtSXCKMImXVpHDV@ballast.proxy.rlwy.net:30883/railway" < backup_supabase.sql
```

### Opzione 2: Abilitare Tabelle su Supabase

1. Vai su **Supabase Dashboard** → **Database** → **API**
2. Verifica che tutte le tabelle siano esposte via PostgREST
3. Se non lo sono, abilita l'esposizione delle tabelle
4. Poi riprova lo script `migrate-via-rest-api.js`

### Opzione 3: Migrazione Parziale (solo tabelle accessibili)

Se hai già migrato manualmente alcune tabelle, posso aggiornare lo script per migrare solo quelle accessibili.

## Script Creati

1. **`server/scripts/test-supabase-access.js`**: Testa l'accesso alle tabelle
2. **`server/scripts/migrate-via-rest-api.js`**: Migra dati via REST API (attualmente fallisce per alcune tabelle)

## Prossimi Passi

**Raccomandazione:** Usa l'**Opzione 1** (Backup SQL) perché:
- È il metodo più veloce
- Include tutti i dati (non solo quelle esposte via API)
- Funziona indipendentemente dalle configurazioni PostgREST

Se vuoi procedere con l'opzione 1, dimmi quando hai scaricato il backup e ti aiuto a importarlo.
