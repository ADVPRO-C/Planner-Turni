# 📋 Step-by-Step: Migrazione Supabase → Railway

## ✅ Stato Attuale

- ✅ Schema database Railway inizializzato
- ✅ Endpoint migrazione creato e pushato su Git
- ⏳ **PROSSIMO**: Deploy e configurazione Railway

---

## 🎯 STEP 1: Verifica Deploy su Railway

### Cosa fare:

1. **Vai su Railway**: https://railway.app
2. **Seleziona il progetto** "Planner-Turni"
3. **Clicca sul servizio backend** (quello che deployi)
4. **Vai su "Deployments"**
5. **Verifica** che l'ultimo deployment sia recente (con il commit appena fatto)

### Se non è deployato automaticamente:

- **Clicca "Redeploy"** o **"Deploy"**
- Aspetta che finisca (1-2 minuti)

### ✅ Segnale che è pronto:

Nei log dovresti vedere:
```
✓ Route migrazione caricate (TEMPORANEA)
Server in esecuzione su http://0.0.0.0:XXXX
```

**✅ Dimmi quando il deploy è completato!**

---

## 🎯 STEP 2: Aggiungi Variabile Ambiente

### Cosa fare:

1. **Railway** → Servizio Backend → **"Variables"** (dalla sidebar)
2. **Clicca "New Variable"** o **"Add Variable"**
3. Aggiungi:
   - **Key**: `SUPABASE_DATABASE_URL`
   - **Value**: `postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres`
4. **Salva**

### ✅ Verifica:

Dovresti vedere la variabile nella lista delle Variables del servizio backend.

**✅ Dimmi quando l'hai aggiunta!**

---

## 🎯 STEP 3: Ottieni URL del Backend Railway

### Cosa fare:

1. **Railway** → Servizio Backend → **"Settings"**
2. Cerca **"Networking"** o **"Public Domain"**
3. **Copia l'URL** tipo: `https://tuo-backend.up.railway.app`

### Oppure:

1. **Railway** → Servizio Backend → **"Deployments"**
2. Clicca sull'ultimo deployment
3. Nei log cerca l'URL del servizio

**✅ Dimmi qual è l'URL del tuo backend Railway!**

---

## 🎯 STEP 4: Test Health Check

Prima di procedere, verifichiamo che il backend funzioni:

### Cosa fare:

Apri nel browser o esegui:
```
https://tuo-backend.railway.app/api/health
```

### ✅ Risultato atteso:

```json
{"status":"OK","message":"Server funzionante"}
```

**✅ Dimmi se vedi questo messaggio!**

---

## 🎯 STEP 5: Esegui Migrazione

### Cosa fare:

Usa uno di questi metodi:

#### Metodo A: Browser/Postman

1. Apri **Postman** o un tool per fare POST request
2. Metodo: **POST**
3. URL: `https://tuo-backend.railway.app/api/migrate/supabase-to-railway`
4. Headers: `Content-Type: application/json`
5. **Send**

#### Metodo B: Terminale (curl)

```bash
curl -X POST https://tuo-backend.railway.app/api/migrate/supabase-to-railway \
  -H "Content-Type: application/json"
```

**✅ Dimmi cosa vedi come risposta!**

---

## 🎯 STEP 6: Verifica Risultati

### Cosa aspettarsi:

Un JSON tipo:
```json
{
  "success": true,
  "message": "Migrazione completata",
  "stats": {
    "total": 9,
    "success": 9,
    "failed": 0,
    "totalRows": 150,
    "details": [...]
  }
}
```

**✅ Controlla quanti record sono stati copiati!**

---

## 🎯 STEP 7: Aggiorna DATABASE_URL

### Cosa fare:

1. **Railway** → Servizio Backend → **"Variables"**
2. **Trova** `DATABASE_URL`
3. **Modifica** il valore con:
   ```
   postgresql://postgres:vyiPjmjNpiYugHWGFmtSXCKMImXVpHDV@ballast.proxy.rlwy.net:30883/railway
   ```
4. **Salva**

### ⚠️ IMPORTANTE:

Questo farà usare Railway invece di Supabase al backend!

**✅ Dimmi quando l'hai aggiornato!**

---

## 🎯 STEP 8: Redeploy Backend

### Cosa fare:

1. **Railway** → Servizio Backend → **"Deployments"**
2. **"Redeploy"**
3. Aspetta che finisca

**✅ Dimmi quando il redeploy è completato!**

---

## 🎯 STEP 9: Test Finale

### Cosa fare:

1. Prova a fare login nell'app
2. Verifica che i dati ci siano (volontari, postazioni, etc.)
3. Controlla che tutto funzioni

**✅ Dimmi se tutto funziona!**

---

## 🎯 STEP 10: Rimuovi Endpoint Temporaneo

Dopo aver verificato che tutto funziona, rimuoviamo l'endpoint di migrazione per sicurezza.

**✅ Procediamo con la rimozione solo quando confermi che tutto funziona!**

---

**Iniziamo con lo STEP 1: Verifica il deploy su Railway e dimmi cosa vedi!** 🚀

