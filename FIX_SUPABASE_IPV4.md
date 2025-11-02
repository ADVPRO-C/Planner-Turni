# 🔧 Fix Connessione Supabase IPv6 → IPv4

## ❌ Problema
Supabase sta restituendo un endpoint IPv6, ma Railway non può connettersi a IPv6 esterni.

## ✅ Soluzione: Usare il Pooler di Supabase (IPv4)

### Metodo 1: Modificare DATABASE_URL per Usare il Pooler

Il **Pooler di Supabase** usa IPv4 e la porta **6543** invece di 5432.

#### Step 1: Vai su Supabase Dashboard

1. Apri **Supabase Dashboard**: https://supabase.com/dashboard
2. Seleziona il tuo progetto
3. Vai su **Settings** → **Database**
4. Scorri fino a **Connection string**
5. Trova la sezione **Connection pooling**

#### Step 2: Copia la Connection String del Pooler

Dovresti vedere qualcosa tipo:

```
postgresql://postgres:[YOUR-PASSWORD]@db.wwcgryzbgvxfviwcjnkg.supabase.co:6543/postgres?pgbouncer=true
```

**Oppure** modifica manualmente la connection string attuale:

**Da:**
```
postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres
```

**A (aggiungi porta 6543 e parametro pgbouncer):**
```
postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:6543/postgres?pgbouncer=true
```

**Oppure prova la versione "Session mode":**
```
postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:6543/postgres?pgbouncer=true&sslmode=require
```

#### Step 3: Aggiorna DATABASE_URL su Railway

1. Vai su **Railway** → Il tuo servizio → **Variables**
2. Clicca su **DATABASE_URL**
3. Sostituisci il valore con la nuova connection string (porta 6543 + pgbouncer)
4. Salva

#### Step 4: Redeploy

1. Vai su **Deployments**
2. **Redeploy** l'ultimo deployment
3. Controlla i log

---

### Metodo 2: Usare Transaction Mode (se Session non funziona)

Se il Session mode non funziona, prova Transaction mode cambiando solo la porta:

```
postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:6543/postgres
```

---

## 🔍 Differenze Porte Supabase

- **Porta 5432**: Direct connection (può essere IPv6)
- **Porta 6543**: Pooled connection via PgBouncer (solitamente IPv4)

Il pooler gestisce le connessioni in modo più efficiente e usa IPv4.

---

## 📋 Connection String Corretta

Usa questa come riferimento:

```
postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:6543/postgres?pgbouncer=true&sslmode=require
```

**Differenze chiave:**
- ✅ Porta: `6543` invece di `5432`
- ✅ Parametro: `?pgbouncer=true`
- ✅ SSL: `&sslmode=require` (opzionale ma consigliato)

---

## ✅ Verifica

Dopo il redeploy, nei log dovresti vedere:

```
✅ DATABASE_URL trovata, parsing connection string
🔍 Tentativo di risoluzione DNS per db.wwcgryzbgvxfviwcjnkg.supabase.co (forzando IPv4)...
✅ Risolto db.wwcgryzbgvxfviwcjnkg.supabase.co -> [indirizzo IPv4] (IPv4)
Connessione al database riuscita
```

**NON dovresti vedere:**
```
❌ Risoluzione DNS IPv4 fallita
Error: ECONNREFUSED
```

---

## 🆘 Se Ancora Non Funziona

1. **Verifica sulla dashboard Supabase** che il pooler sia abilitato
2. **Prova entrambe le modalità**:
   - Session mode: `?pgbouncer=true`
   - Transaction mode: senza parametri (solo porta 6543)
3. **Controlla i log** per vedere quale indirizzo viene risolto

---

**La chiave è usare la porta 6543 invece di 5432 per forzare il pooler IPv4!** 🎯

