# 🔄 Guida Completa: Migrazione da Supabase a Railway PostgreSQL

## ✅ Cosa ho preparato

Ho creato uno script di migrazione automatica che:
- ✅ Si connette a entrambi i database (Supabase e Railway)
- ✅ Legge tutte le tabelle e i dati da Supabase
- ✅ Copia i dati nel giusto ordine (rispettando le foreign keys)
- ✅ Gestisce duplicati e errori automaticamente
- ✅ Fornisce un report dettagliato della migrazione

## 📋 Procedura Step-by-Step

### Step 1: Crea Database PostgreSQL su Railway

1. **Vai su Railway**: https://railway.app
2. **Seleziona progetto** "Planner-Turni"
3. **"New"** → **"Database"** → **"Add PostgreSQL"**
4. **Aspetta** 1-2 minuti che il database sia pronto

### Step 2: Inizializza lo Schema sul Database Railway

Il database Railway è vuoto, devi creare le tabelle:

**Opzione A: Via Script Node.js (consigliato)**

```bash
# Vai nella directory server
cd server

# Imposta la connection string di Railway
export DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway"

# Esegui lo script di inizializzazione
npm run init:railway-db
```

**Opzione B: Via Railway CLI**

```bash
# Installa Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link al progetto
railway link

# Esegui schema SQL
railway run --service [nome-servizio-database] psql < database/schema.sql
```

### Step 3: Configura le Variabili Ambiente

Crea un file `.env.migration` (o usa variabili ambiente):

```bash
# Connection string Supabase (quella attuale)
SUPABASE_DATABASE_URL="postgresql://postgres:[PASSWORD]@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres"

# Connection string Railway (quella nuova)
RAILWAY_DATABASE_URL="postgresql://postgres:[PASSWORD]@containers-us-west-xxx.railway.app:5432/railway"
```

Oppure imposta le variabili direttamente:

```bash
export SUPABASE_DATABASE_URL="postgresql://..."
export RAILWAY_DATABASE_URL="postgresql://..."
```

### Step 4: Esegui la Migrazione

```bash
# Vai nella directory server
cd server

# Carica le variabili ambiente (se usi .env.migration)
source .env.migration  # Su Linux/Mac
# oppure su Windows:
# set SUPABASE_DATABASE_URL=...
# set RAILWAY_DATABASE_URL=...

# Esegui la migrazione
npm run migrate:supabase-to-railway
```

Lo script:
- ✅ Si connette a Supabase e Railway
- ✅ Verifica che le tabelle esistano
- ✅ Copia i dati nel giusto ordine
- ✅ Mostra progresso e statistiche
- ✅ Gestisce errori automaticamente

### Step 5: Verifica la Migrazione

Controlla i log dello script per vedere:
- Quante tabelle sono state migrate
- Quanti record sono stati copiati
- Eventuali errori o warning

### Step 6: Aggiorna DATABASE_URL su Railway

1. **Vai sul servizio backend** su Railway
2. **Variables** → `DATABASE_URL`
3. **Sostituisci** con la connection string di Railway:
   ```
   postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
   ```
4. **Salva**

### Step 7: Redeploy Backend

1. Vai su **Deployments** del servizio backend
2. **Redeploy**
3. Nei log dovresti vedere: `✅ Connessione al database riuscita`

---

## 📊 Cosa viene Migrato

Lo script migra automaticamente queste tabelle (se esistono):

1. **congregazioni** - Lista delle congregazioni
2. **volontari** - Tutti i volontari con password hash
3. **postazioni** - Postazioni configurate
4. **slot_orari** - Orari disponibili per ogni postazione
5. **disponibilita** - Disponibilità dei volontari
6. **assegnazioni** - Turni assegnati
7. **assegnazioni_volontari** - Relazione volontari-turni
8. **notifiche** - Notifiche agli utenti
9. **notifications** - Notifiche alternative (se esiste)
10. Altre tabelle trovate automaticamente

---

## ⚠️ Cosa Attenzione

1. **Password Hash**: Le password vengono copiate così come sono (non vengono rehashate)
2. **Foreign Keys**: Lo script rispetta l'ordine per evitare errori di foreign key
3. **Duplicati**: Usa `ON CONFLICT DO NOTHING` per evitare duplicati
4. **Sequenze**: Le sequenze (auto-increment) potrebbero non essere sincronizzate. Se necessario, posso aggiungere un fix.

---

## 🔧 Troubleshooting

### Errore: "Connection refused"

- Verifica che le connection string siano corrette
- Verifica che i database siano accessibili

### Errore: "Table does not exist"

- Assicurati di aver eseguito lo schema prima (`npm run init:railway-db`)

### Errore: "Foreign key violation"

- Lo script gestisce automaticamente l'ordine, ma se persiste, verifica lo schema

### Record duplicati

- Lo script usa `ON CONFLICT DO NOTHING`, quindi i duplicati vengono ignorati

---

## ✅ Checklist Finale

- [ ] Database Railway creato
- [ ] Schema eseguito sul database Railway
- [ ] Variabili ambiente configurate (SUPABASE_DATABASE_URL e RAILWAY_DATABASE_URL)
- [ ] Migrazione eseguita con successo
- [ ] DATABASE_URL aggiornata su Railway backend
- [ ] Backend redeployato
- [ ] Testato login e funzionalità base

---

**Se hai problemi durante la migrazione, dimmi e ti aiuto!**

