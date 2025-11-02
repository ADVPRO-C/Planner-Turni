# ⚡ Quick Start: Migrazione Supabase → Railway

## 🎯 Cosa viene Migrato

✅ **Tutte le tabelle**:
- `congregazioni`
- `volontari` (con password hash)
- `postazioni`
- `slot_orari`
- `disponibilita`
- `assegnazioni`
- `assegnazioni_volontari`
- `notifiche`
- `notifications`
- `esperienze` (se esiste)
- `documenti` (se esiste)
- E qualsiasi altra tabella trovata

✅ **Tutti i dati**: Record completi, relazioni, foreign keys

✅ **Password**: Hash password vengono copiati così come sono (funzionano subito)

---

## 📋 Procedura Veloce

### 1. Crea Database Railway

Railway → Progetto → **"New"** → **"Database"** → **"Add PostgreSQL"**

### 2. Copia Connection Strings

- **Supabase**: La tua connection string attuale
- **Railway**: La nuova connection string dal database appena creato

### 3. Esegui Schema sul Database Railway

```bash
cd server
export DATABASE_URL="postgresql://...railway..."  # Connection string Railway
npm run init:railway-db
```

### 4. Esegui Migrazione

```bash
export SUPABASE_DATABASE_URL="postgresql://...supabase..."  # Connection string Supabase
export RAILWAY_DATABASE_URL="postgresql://...railway..."    # Connection string Railway
npm run migrate:supabase-to-railway
```

### 5. Aggiorna Railway Backend

Railway → Servizio Backend → **Variables** → `DATABASE_URL` → Incolla connection string Railway

### 6. Redeploy Backend

Railway → Servizio Backend → **Deployments** → **Redeploy**

---

## ✅ Fine!

Il backend userà il database Railway e tutto funzionerà come prima!

---

**Se hai bisogno di aiuto durante la migrazione, dimmi!**

