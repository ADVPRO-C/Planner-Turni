# 🔧 Fix: Aggiorna DATABASE_URL su Railway

## ❌ Problema Attuale

L'errore mostra:
```
Error: connect ENETUNREACH 2a05:d01c:30c:9d20:9e8b:bfe9:f009:3247:5432
```

Questo è un indirizzo **IPv6** di Supabase. Railway non può connettersi a IPv6 esterni.

**Causa**: `DATABASE_URL` su Railway è ancora configurata con la connection string di Supabase.

---

## ✅ Soluzione: Aggiorna DATABASE_URL

### Step 1: Vai su Railway

1. **Railway Dashboard** → Progetto "Planner-Turni"
2. **Servizio Backend** (quello che deployi)
3. **"Variables"** (dalla sidebar)

### Step 2: Trova DATABASE_URL

1. Cerca la variabile `DATABASE_URL` nella lista
2. **Clicca su di essa** per modificarla

### Step 3: Sostituisci con Connection String Railway

**Sostituisci** il valore attuale (quello di Supabase) con:

```
postgresql://postgres:vyiPjmjNpiYugHWGFmtSXCKMImXVpHDV@ballast.proxy.rlwy.net:30883/railway
```

### Step 4: Salva

1. **Clicca "Save"** o **"Update"**
2. Railway farà un **redeploy automatico**

---

## ✅ Risultato Atteso

Dopo il redeploy, nei log dovresti vedere:
- ✅ Connessione al database riuscita
- Nessun errore ENETUNREACH

---

## ⚠️ Nota Importante

**Dopo** aver aggiornato `DATABASE_URL` con quella di Railway:
- Il backend userà il database Railway (non Supabase)
- Prima di aggiornare, assicurati che i dati siano migrati (passo successivo)

---

**Fai questo cambio e dimmi quando è fatto! Poi procediamo con la migrazione dei dati.** 🎯

