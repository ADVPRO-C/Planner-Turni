# 📋 Informazioni Richieste per la Migrazione

## 🔑 Cosa mi Serve

Per eseguire la migrazione, ho bisogno di **2 connection string**:

### 1. ✅ Connection String Supabase (Database Sorgente)

**Dove trovarla:**
- Supabase Dashboard → Il tuo progetto → **Settings** → **Database**
- Cerca **"Connection string"** o **"Connection pooling"**
- Usa la connection string tipo:
  ```
  postgresql://postgres:[PASSWORD]@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres
  ```

**⚠️ IMPORTANTE:**
- Sostituisci `[PASSWORD]` con la password reale (quella che hai già usato: `2vQ-i60MqwHG`)
- Esempio completo:
  ```
  postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres
  ```

---

### 2. ✅ Connection String Railway (Database Destinazione)

**Prima di tutto, devi creare il database Railway:**

1. Vai su Railway: https://railway.app
2. Seleziona il progetto "Planner-Turni"
3. Clicca **"New"** → **"Database"** → **"Add PostgreSQL"**
4. Aspetta 1-2 minuti che il database sia pronto

**Poi trova la connection string:**
- Clicca sul database appena creato
- Vai su **"Settings"** → **"Connect"**
- Cerca **"Connection Variables"** o **"DATABASE_URL"**
- Copia la connection string tipo:
  ```
  postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
  ```

**⚠️ IMPORTANTE:**
- La password è quella generata automaticamente da Railway
- Non modificarla, copiala così come è

---

## 📝 Formato da Fornire

Quando hai entrambe le connection string, forniscile in questo formato:

```
SUPABASE: postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres

RAILWAY: postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

---

## ✅ Checklist

Prima di procedere, assicurati di avere:

- [ ] Database Railway creato
- [ ] Connection string Supabase copiata
- [ ] Connection string Railway copiata
- [ ] Entrambe le connection string pronte da fornirmi

---

## 🚀 Dopo che mi Fornisci i Dati

1. **Inizializzerò lo schema** sul database Railway (creerò le tabelle)
2. **Eseguirò la migrazione** (copierò tutti i dati)
3. **Ti mostrerò il report** con statistiche e risultati

**Tempo stimato:** 2-5 minuti (dipende dalla quantità di dati)

---

**Fornisci le 2 connection string quando sei pronto!** 🎯

