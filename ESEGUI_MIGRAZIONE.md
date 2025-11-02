# 🚀 Come Eseguire la Migrazione da Railway

## ✅ Cosa ho fatto

Ho creato un endpoint temporaneo `/api/migrate/supabase-to-railway` che esegue la migrazione direttamente da Railway.

## 📋 Procedura

### Step 1: Deploy Backend su Railway (se non già fatto)

Assicurati che il backend sia deployato su Railway con:
- `DATABASE_URL` configurata con la connection string di Railway
- Le variabili ambiente corrette

### Step 2: Aggiungi Variabile Ambiente su Railway

Railway → Servizio Backend → **Variables** → Aggiungi:

**Key**: `SUPABASE_DATABASE_URL`  
**Value**: `postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres`

### Step 3: Redeploy Backend

Railway → Servizio Backend → **Deployments** → **Redeploy**

### Step 4: Chiama l'Endpoint

Dopo che il backend è online, chiama:

```bash
curl -X POST https://tuo-backend.railway.app/api/migrate/supabase-to-railway
```

Oppure vai nel browser e apri:
```
https://tuo-backend.railway.app/api/migrate/supabase-to-railway
```

(Devi fare una POST request - usa Postman, curl, o lo script qui sotto)

### Step 5: Verifica Risultato

L'endpoint restituirà un JSON con:
- Statistiche della migrazione
- Numero di tabelle migrate
- Numero di record copiati

### Step 6: Rimuovi Endpoint (Dopo Migrazione)

Una volta completata la migrazione, rimuovi il file `server/routes/migrate.js` e le righe relative in `server/index.js`.

---

## 🔧 Script per Chiamare l'Endpoint

Crea un file `migrate.sh`:

```bash
#!/bin/bash

RAILWAY_URL="https://tuo-backend.railway.app"

echo "🚀 Avvio migrazione..."
curl -X POST "$RAILWAY_URL/api/migrate/supabase-to-railway" \
  -H "Content-Type: application/json" \
  | jq .

echo ""
echo "✅ Migrazione completata! Controlla il risultato sopra."
```

Esegui: `bash migrate.sh`

---

## ⚠️ Nota di Sicurezza

Questo endpoint è temporaneo e dovrebbe essere rimosso dopo la migrazione. Non ha autenticazione, quindi chiunque con l'URL può eseguirlo.

**Rimuovi dopo la migrazione!**

---

**Fammi sapere quando hai deployato e possiamo procedere con la chiamata all'endpoint!** 🎯

