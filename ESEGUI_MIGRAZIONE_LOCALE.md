# 🚀 Esegui Migrazione Localmente

## ✅ Prerequisiti

Il tuo Mac deve poter connettersi a Supabase (anche via IPv6 va bene).

---

## 📋 Procedura

### Step 1: Vai nella directory server

```bash
cd "/Users/zy0n/Desktop/Web Development Project/My WebApp/PLANNER PROJECT/PLANNER/server"
```

### Step 2: Esegui la migrazione

```bash
export SUPABASE_DATABASE_URL="postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres"
export RAILWAY_DATABASE_URL="postgresql://postgres:vyiPjmjNpiYugHWGFmtSXCKMImXVpHDV@ballast.proxy.rlwy.net:30883/railway"

node scripts/migrate-supabase-to-railway.js
```

---

## ✅ Cosa Aspettarsi

Lo script mostrerà:
- ✅ Connessione a Supabase
- ✅ Connessione a Railway  
- ✅ Progresso migrazione per ogni tabella
- ✅ Statistiche finali

---

## 🎯 Se Funziona

Quando vedi:
```
✅ Migrazione completata!
📊 Totale record copiati: XXX
```

**La migrazione è completata!** 🎉

---

## ❌ Se Non Funziona

Se vedi errori di connessione, dimmi l'errore esatto e troviamo un'alternativa.

---

**Esegui questi comandi e dimmi cosa succede!** 🚀

