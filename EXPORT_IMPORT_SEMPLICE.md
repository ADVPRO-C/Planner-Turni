# 🚀 Guida Semplice: Export/Import Dati

## 📋 STEP 1: Export da Supabase

### Metodo Semplice: Usa pg_dump (se disponibile)

Se hai `pg_dump` installato sul tuo Mac:

```bash
pg_dump "postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres" \
  --data-only \
  --no-owner \
  --no-acl \
  --format=plain \
  --file=supabase_data_export.sql
```

Questo creerà un file con tutti gli INSERT statements pronti!

### Metodo Alternativo: Supabase Dashboard

1. **Vai su Supabase Dashboard** → SQL Editor
2. **Esegui queste query una alla volta** e salva i risultati:

```sql
-- Query 1: Congregazioni
SELECT * FROM congregazioni ORDER BY id;

-- Query 2: Volontari  
SELECT * FROM volontari ORDER BY id;

-- Query 3: Postazioni
SELECT * FROM postazioni ORDER BY id;

-- Query 4: Slot Orari
SELECT * FROM slot_orari ORDER BY id;

-- Query 5: Disponibilità
SELECT * FROM disponibilita ORDER BY id;

-- Query 6: Assegnazioni
SELECT * FROM assegnazioni ORDER BY id;

-- Query 7: Assegnazioni Volontari
SELECT * FROM assegnazioni_volontari ORDER BY id;

-- Query 8: Notifiche (se esiste)
SELECT * FROM notifiche ORDER BY id;
```

---

## 📋 STEP 2: Import in Railway

### Opzione A: Usa il file export completo

Se hai usato `pg_dump`:

```bash
psql "postgresql://postgres:vyiPjmjNpiYugHWGFmtSXCKMImXVpHDV@ballast.proxy.rlwy.net:30883/railway" < supabase_data_export.sql
```

### Opzione B: Usa le query export da Dashboard

Se hai esportato via Dashboard, posso aiutarti a convertirle in INSERT statements.

---

## 🎯 Prossimo Passo

**Dimmi:**
1. Hai `pg_dump` installato sul Mac? (Controlla con: `which pg_dump`)
2. Oppure preferisci esportare via Supabase Dashboard?

**In base alla tua risposta, ti guido nel metodo più semplice!** 🚀

