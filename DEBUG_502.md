# 🔍 Debug Errore 502

## ❌ Problema

Il backend risponde con:
```json
{"status":"error","code":502,"message":"Application failed to respond"}
```

Questo significa che Railway non riesce a raggiungere il servizio.

---

## 🔍 Possibili Cause

1. **Servizio in fase di avvio** (aspetta qualche secondo)
2. **Backend crashato dopo l'avvio**
3. **Problema di configurazione dominio/porta**

---

## ✅ Cosa Verificare

### 1. Verifica Log Recenti

Railway → Servizio Backend → **"Deployments"** → Ultimo deployment → **"Logs"**

**Cerca:**
- ✅ `Server in esecuzione su http://0.0.0.0:8080` (o altra porta)
- ✅ `Connessione al database riuscita`
- ❌ Errori o crash

### 2. Verifica Stato Deployment

Railway → Servizio Backend → **"Deployments"**

**Lo stato è:**
- ✅ **"Active"** o **"Deployed"**?
- ❌ **"Failed"** o **"Building"**?

### 3. Verifica Variabili Ambiente

Railway → Servizio Backend → **"Variables"**

**Verifica:**
- ✅ `DATABASE_URL` presente e corretta (Railway)
- ✅ `SUPABASE_DATABASE_URL` presente (per migrazione)
- ✅ `JWT_SECRET` presente
- ✅ `NODE_ENV` = `production`

---

## 🔧 Possibili Soluzioni

### Soluzione 1: Redeploy

1. Railway → Servizio Backend → **"Deployments"**
2. **"Redeploy"** (pulsante in alto)
3. Aspetta 1-2 minuti
4. Riprova

### Soluzione 2: Verifica Porta

Nei log ho visto che il server ascolta su porta **8080**, non 5001.

Railway gestisce automaticamente il routing, quindi:
- ✅ Non serve settare manualmente la porta
- ✅ Il dominio pubblico dovrebbe funzionare senza specificare porta

**Rimuovi** eventuali configurazioni di porta manuali.

### Soluzione 3: Verifica Log Errore

Controlla i log per vedere se ci sono errori dopo `"Server in esecuzione"`.

---

## 📋 Informazioni Richieste

**Dimmi:**
1. **Cosa vedi nei log più recenti?** (ultimi 20-30 messaggi)
2. **Stato del deployment** (Active/Failed/Building)?
3. **Ci sono errori** nei log dopo l'avvio del server?

**Con queste info posso aiutarti a risolvere!** 🔍

