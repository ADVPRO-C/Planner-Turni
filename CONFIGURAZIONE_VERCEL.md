# ⚙️ Configurazione Vercel per Frontend

## 📋 Variabile Ambiente da Configurare

Devi aggiungere questa variabile ambiente su Vercel:

```
REACT_APP_API_URL=https://planner-turni-production.up.railway.app/api
```

## 📝 Istruzioni Passo-Passo

### Metodo 1: Via Dashboard Vercel (Consigliato)

1. **Vai su Vercel Dashboard**
   - Accedi a https://vercel.com/dashboard
   - Seleziona il progetto "planner-turni" (o il nome del tuo progetto)

2. **Apri Settings**
   - Clicca su "Settings" nella barra superiore
   - Clicca su "Environment Variables" nel menu laterale

3. **Aggiungi la Variabile**
   - Clicca su "Add New"
   - **Key:** `REACT_APP_API_URL`
   - **Value:** `https://planner-turni-production.up.railway.app/api`
   - **Environment:** Seleziona tutte le opzioni:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Clicca "Save"

4. **Redeploy**
   - Vai alla sezione "Deployments"
   - Trova l'ultimo deployment
   - Clicca sui tre puntini (...) → "Redeploy"
   - Seleziona "Use existing Build Cache" (opzionale)
   - Clicca "Redeploy"

### Metodo 2: Via CLI Vercel

```bash
# Installa Vercel CLI (se non l'hai già)
npm i -g vercel

# Aggiungi la variabile ambiente
vercel env add REACT_APP_API_URL production
# Quando chiede il valore, inserisci:
# https://planner-turni-production.up.railway.app/api

# Ripeti per preview e development se necessario
vercel env add REACT_APP_API_URL preview
vercel env add REACT_APP_API_URL development
```

## ✅ Verifica

Dopo il redeploy, verifica che la variabile sia attiva:

1. Vai al deployment su Vercel
2. Controlla i logs del build
3. Cerca nel console del browser (F12) il log:
   ```
   🔗 API Base URL configurato: https://planner-turni-production.up.railway.app/api
   ```
   
   Se vedi questo invece di `localhost:5001`, la configurazione è corretta!

## 🧪 Test Post-Configurazione

Dopo il redeploy:

1. Apri l'app su Vercel (il dominio pubblico)
2. Apri la console del browser (F12)
3. Verifica che l'API URL sia corretto
4. Prova a fare login
5. Verifica che i dati vengano caricati correttamente

## 🔗 URL di Riferimento

- **Backend Railway:** `https://planner-turni-production.up.railway.app`
- **API Base:** `https://planner-turni-production.up.railway.app/api`
- **Frontend Vercel:** (il tuo dominio Vercel, es: `planner-turni.vercel.app`)

## ⚠️ Note Importanti

1. **REBUILD RICHIESTO:** Dopo aver aggiunto una variabile ambiente che inizia con `REACT_APP_`, devi fare un nuovo build. Vercel lo fa automaticamente con il redeploy.

2. **Mobile Access:** Senza questa variabile, l'app su mobile proverà a usare `localhost:5001` che non funziona. Con questa configurazione, funzionerà su tutti i dispositivi.

3. **CORS:** Il backend Railway è già configurato per accettare richieste da qualsiasi origine, quindi non ci sono problemi di CORS.

