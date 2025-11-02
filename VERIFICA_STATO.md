# ✅ Verifica Stato Sistema

## 🔍 Cosa Verificare

### 1. Log Railway - Verifica Connessione Database

**Cosa fare:**
1. Railway Dashboard → Servizio Backend → **"Deployments"**
2. Clicca sull'ultimo deployment
3. Vai su **"Logs"**
4. Cerca questi messaggi:

**✅ SEGNALI POSITIVI:**
```
✅ DATABASE_URL trovata, parsing connection string
Connessione al database riuscita
✓ Route migrazione caricate (TEMPORANEA)
Server in esecuzione su http://0.0.0.0:8080
```

**❌ SEGNALI NEGATIVI:**
```
❌ Errore nella connessione al database
ENETUNREACH
ECONNREFUSED
```

---

### 2. Verifica Variabili Ambiente

**Cosa fare:**
1. Railway → Servizio Backend → **"Variables"**
2. Verifica che esistano queste variabili:

**✅ Devono essere presenti:**
- `DATABASE_URL` → deve contenere `ballast.proxy.rlwy.net` (Railway)
- `SUPABASE_DATABASE_URL` → deve contenere `supabase.co` (Supabase)
- `JWT_SECRET` → deve essere presente
- `NODE_ENV` → dovrebbe essere `production`

---

### 3. Test Health Check

**Cosa fare:**
1. Railway → Servizio Backend → **"Settings"**
2. Cerca **"Networking"** o **"Public Domain"**
3. **Copia l'URL** (tipo: `https://tuo-backend.up.railway.app`)
4. Apri nel browser: `https://tuo-backend.up.railway.app/api/health`

**✅ Risultato atteso:**
```json
{"status":"OK","message":"Server funzionante"}
```

---

### 4. Test Endpoint Migrazione (Solo Disponibilità)

**Cosa fare:**
Apri nel browser (dovrebbe dare errore 404 per GET, ma questo significa che l'endpoint esiste):
```
https://tuo-backend.up.railway.app/api/migrate/supabase-to-railway
```

**✅ Risultato atteso:**
- Se fa POST → dovrebbe rispondere (anche con errore se mancano dati)
- Se fa GET → 404 o errore metodo non permesso (ok, significa che l'endpoint esiste)

---

## 📋 Checklist Completa

- [ ] Log Railway mostrano "Connessione al database riuscita" (nessun errore ENETUNREACH)
- [ ] Variabile `DATABASE_URL` contiene connection string Railway
- [ ] Variabile `SUPABASE_DATABASE_URL` contiene connection string Supabase
- [ ] Health check `/api/health` risponde correttamente
- [ ] Server è online e funzionante

---

**Fornisci:**
1. **URL del backend Railway** (tipo: `https://xxx.up.railway.app`)
2. **Cosa vedi nei log** (errore o "Connessione riuscita"?)
3. **Cosa vedi nel test `/api/health`**

**Con queste info posso verificare tutto!** 🔍

