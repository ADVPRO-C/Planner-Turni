# 📋 Guida: Export/Import Dati via SQL

## 🎯 Procedura Step-by-Step

### STEP 1: Export da Supabase

1. **Vai su Supabase Dashboard**: https://supabase.com/dashboard
2. **Seleziona il progetto**
3. **SQL Editor** → **New Query**
4. **Copia le query** da `server/scripts/export-supabase-data.sql`
5. **Esegui una query alla volta** e copia i risultati

---

### STEP 2: Prepara i Dati per Import

Per ogni tabella:
1. **Esegui la query export** in Supabase
2. **Copia tutti i risultati** (le righe con i dati)
3. **Converte i risultati in formato INSERT**

**Esempio:**

Se la query export di `congregazioni` restituisce:
```
id | codice | nome              | created_at | updated_at
1  | 001    | Palermo Uditore   | 2024-01-01 | 2024-01-01
```

Devi creare:
```sql
INSERT INTO congregazioni (id, codice, nome, created_at, updated_at)
VALUES 
  (1, '001', 'Palermo Uditore', '2024-01-01 00:00:00', '2024-01-01 00:00:00')
ON CONFLICT (id) DO NOTHING;
```

---

### STEP 3: Import in Railway

**Opzione A: Via Railway Dashboard (se disponibile)**

1. Railway → Database PostgreSQL → **"Query"** o **"SQL Editor"**
2. Incolla gli INSERT statements
3. Esegui

**Opzione B: Via psql (da terminale)**

```bash
psql "postgresql://postgres:vyiPjmjNpiYugHWGFmtSXCKMImXVpHDV@ballast.proxy.rlwy.net:30883/railway" < import-railway-data.sql
```

**Opzione C: Via Script Node.js**

Posso creare uno script che legge i dati e li importa.

---

## ⚠️ Ordine Import (IMPORTANTE!)

Esegui gli INSERT in questo ordine per rispettare le foreign keys:

1. `congregazioni` (nessuna dipendenza)
2. `volontari` (dipende da congregazioni)
3. `postazioni` (dipende da congregazioni)
4. `slot_orari` (dipende da postazioni, congregazioni)
5. `disponibilita` (dipende da volontari, slot_orari, congregazioni)
6. `assegnazioni` (dipende da postazioni, slot_orari, congregazioni)
7. `assegnazioni_volontari` (dipende da assegnazioni, volontari, congregazioni)
8. `notifiche` / `notifications` (se esistono)

---

## 🔧 Alternativa: Script Automatico

Posso creare uno script che:
1. Ti guida a copiare i dati da Supabase (query per query)
2. Li formatta automaticamente in INSERT statements
3. Li importa in Railway

**Preferisci questa opzione o vuoi procedere manualmente?**

---

**Fammi sapere come vuoi procedere!** 🚀

