# 📦 Migrazione Database da Supabase a Railway PostgreSQL

## 🎯 Perché Migrare

- ✅ Railway non supporta IPv6 esterni
- ✅ Supabase gratuito forza IPv6
- ✅ Railway PostgreSQL è gratuito e funziona perfettamente

## 📋 Procedura Completa

### Step 1: Crea Database PostgreSQL su Railway

1. **Vai su Railway Dashboard**: https://railway.app
2. **Seleziona il tuo progetto** "Planner-Turni"
3. **Clicca "New"** → **"Database"** → **"Add PostgreSQL"**
4. Railway creerà automaticamente un database PostgreSQL
5. **Aspetta** che il database sia pronto (1-2 minuti)

### Step 2: Trova la Connection String

1. **Clicca sul database** appena creato
2. Vai su **"Settings"** → **"Connect"**
3. Cerca **"Connection Variables"** o **"DATABASE_URL"**
4. **Copia la connection string** tipo:
   ```
   postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
   ```

### Step 3: Aggiorna DATABASE_URL sul Backend

1. **Vai sul servizio backend** (quello che stai deployando)
2. **Variables** → Clicca su **`DATABASE_URL`**
3. **Sostituisci** con la nuova connection string di Railway
4. **Salva**

### Step 4: Esegui lo Schema del Database

Hai due opzioni:

#### Opzione A: Via Railway CLI

```bash
# Installa Railway CLI
npm i -g @railway/cli

# Login
railway login

# Esegui schema
railway run --service database psql < server/database/schema.sql
```

#### Opzione B: Via Script Node.js

Posso creare uno script che esegue lo schema automaticamente.

### Step 5: Migra i Dati da Supabase (Opzionale)

Se hai dati importanti su Supabase:

1. **Export da Supabase**:
   - Dashboard Supabase → SQL Editor
   - Esegui query per esportare dati

2. **Import in Railway**:
   - Usa `psql` o uno script Node.js

---

## 🔄 Alternativa: Mantieni Entrambi Temporaneamente

Se vuoi testare prima di migrare completamente:

1. Mantieni Supabase attivo
2. Crea database Railway
3. Testa che funzioni
4. Migra i dati quando sei sicuro

---

## ✅ Vantaggi Database Railway

- ✅ IPv4 nativo (nessun problema di connettività)
- ✅ Stessa infrastruttura (bassa latenza)
- ✅ Gratuito fino a 5GB
- ✅ Backup automatici
- ✅ Scaling semplice

---

Vuoi che ti guidi passo-passo nella creazione del database Railway?

