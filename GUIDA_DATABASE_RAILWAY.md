# 🗄️ Guida: Creare Database PostgreSQL su Railway

## 🎯 Obiettivo
Creare un database PostgreSQL su Railway per sostituire Supabase (che usa IPv6 non supportato).

## 📋 Step-by-Step

### Step 1: Crea il Database

1. **Vai su Railway**: https://railway.app
2. **Seleziona il tuo progetto** "Planner-Turni"
3. **Clicca "New"** (in alto a destra o nel menu)
4. **Seleziona "Database"** → **"Add PostgreSQL"**
5. Railway creerà automaticamente un database PostgreSQL
6. **Aspetta** 1-2 minuti che il database sia pronto

### Step 2: Trova la Connection String

1. **Clicca sul database** appena creato (apparirà come un nuovo servizio)
2. Vai su **"Settings"** (dalla sidebar)
3. Cerca **"Connect"** o **"Connection Variables"**
4. Dovresti vedere:
   - **`DATABASE_URL`**: La connection string completa
   - Oppure variabili separate: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

5. **Copia `DATABASE_URL`** (la connection string completa)

**Esempio di connection string Railway:**
```
postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

### Step 3: Aggiorna DATABASE_URL sul Backend

1. **Vai sul servizio backend** (quello che deployi)
2. **Variables** (dalla sidebar)
3. **Clicca su `DATABASE_URL`**
4. **Sostituisci** il valore con la connection string del database Railway che hai copiato
5. **Salva**

### Step 4: Esegui lo Schema del Database

Il database è vuoto, devi creare le tabelle. Hai due opzioni:

#### Opzione A: Via Railway CLI (più semplice)

```bash
# Installa Railway CLI
npm i -g @railway/cli

# Login
railway login

# Seleziona il progetto
railway link

# Esegui schema SQL
railway run --service [nome-database] psql < server/database/schema.sql
```

#### Opzione B: Via Script Node.js (che posso creare)

Posso creare uno script che si connette e esegue lo schema automaticamente.

### Step 5: Redeploy Backend

1. Vai su **Deployments** del servizio backend
2. **Redeploy**
3. Nei log dovresti vedere: `✅ Connessione al database riuscita`

---

## ✅ Vantaggi Database Railway

- ✅ IPv4 nativo (funziona perfettamente)
- ✅ Stessa infrastruttura (bassa latenza)
- ✅ Gratuito fino a 5GB
- ✅ Backup automatici
- ✅ Scaling semplice

---

## 🔄 Migrazione Dati (Opzionale)

Se hai dati importanti su Supabase da migrare, posso aiutarti a crear uno script di migrazione.

---

**Vuoi che ti guidi passo-passo nella creazione del database Railway?**

