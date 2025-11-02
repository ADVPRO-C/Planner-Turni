# Deploy con Supabase - Guida Completa

## Panoramica
Questa guida ti aiuterà a deployare il backend che si connette al database Supabase e configurare il frontend su Vercel.

## Step 1: Ottieni le Credenziali Supabase

1. Vai su https://supabase.com/dashboard
2. Seleziona il tuo progetto
3. Vai su **Settings** → **Database**
4. Trova la sezione **Connection string**
5. Copia la **Connection string** (formato URI) o le credenziali:
   ```
   Host: db.xxxxx.supabase.co
   Port: 5432
   Database: postgres
   User: postgres
   Password: [la tua password]
   ```

## Step 2: Importa il Database Schema su Supabase

1. Vai su **SQL Editor** in Supabase
2. Apri il file `server/database/schema.sql`
3. Copia tutto il contenuto
4. Incollalo nell'SQL Editor di Supabase
5. Esegui lo script (Run)

**Nota**: Se hai dati esistenti, esegui prima le migration necessarie.

## Step 3: Deploy del Backend su Railway (Consigliato)

### Opzione A: Railway (Più Semplice)

1. Vai su https://railway.app
2. Registrati/Accedi con GitHub
3. Crea un nuovo progetto: **New Project**
4. Seleziona **Deploy from GitHub repo**
5. Connetti il repository e seleziona la cartella `server` come root
6. Railway rileva automaticamente Node.js

7. **Configura le variabili d'ambiente**:
   - Vai su **Variables** del servizio
   - Aggiungi:
     ```
     DATABASE_URL=postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres
     JWT_SECRET=il-tuo-secret-jwt-super-sicuro
     NODE_ENV=production
     PORT=5001
     ```

8. Railway darà un URL tipo: `https://tuo-backend.up.railway.app`
9. Il backend sarà disponibile su: `https://tuo-backend.up.railway.app/api`

### Opzione B: Render

1. Vai su https://render.com
2. Crea un nuovo **Web Service**
3. Connetti il repository GitHub
4. Configurazione:
   - **Root Directory**: `server`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
5. Aggiungi le stesse variabili d'ambiente di Railway
6. Render darà un URL tipo: `https://tuo-backend.onrender.com/api`

### Opzione C: Fly.io

1. Installa Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
2. Vai nella cartella `server`
3. Esegui: `fly launch`
4. Segui le istruzioni e configura le variabili d'ambiente

## Step 4: Verifica che il Backend Funzioni

1. Apri nel browser: `https://tuo-backend.up.railway.app/api/health`
2. Dovresti vedere:
   ```json
   {"status":"OK","message":"Server funzionante"}
   ```

Se vedi errori, controlla i log su Railway/Render.

## Step 5: Configura Vercel (Frontend)

1. Vai su https://vercel.com/dashboard
2. Seleziona il progetto del frontend
3. Vai su **Settings** → **Environment Variables**
4. Aggiungi:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://tuo-backend.up.railway.app/api` (sostituisci con il tuo URL)
   - Seleziona: ✅ Production, ✅ Preview, ✅ Development
5. **Salva**
6. Vai su **Deployments** → Trova il deployment più recente
7. Clicca sui tre puntini (⋯) → **Redeploy**
8. Seleziona **Use existing Build Cache** → **Redeploy**

## Step 6: Configura CORS sul Backend (se necessario)

Il backend ha già CORS configurato, ma se hai problemi, aggiungi al file `server/index.js`:

```javascript
app.use(cors({
  origin: [
    'https://tuo-frontend.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));
```

## Troubleshooting

### Errore di connessione al database:
- ✅ Verifica che la connection string DATABASE_URL sia corretta
- ✅ Verifica che la password sia corretta (può contenere caratteri speciali, usa URL encoding se necessario)
- ✅ Verifica che il database Supabase accetti connessioni esterne
- ✅ Controlla i log di Railway/Render per errori specifici

### Errore 401 sul frontend:
- ✅ Verifica che REACT_APP_API_URL sia configurata correttamente su Vercel
- ✅ Verifica che il backend sia online (prova `/api/health`)
- ✅ Verifica che il backend risponda alle richieste CORS

### Errore SSL:
- Il codice gestisce già SSL per produzione, ma se hai problemi, verifica che Supabase richieda SSL

## Variabili d'Ambiente Backend

Variabili necessarie sul servizio di hosting (Railway/Render):

```
DATABASE_URL=postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres
JWT_SECRET=un-secret-molto-lungo-e-sicuro
NODE_ENV=production
PORT=5001
```

## Variabili d'Ambiente Frontend (Vercel)

```
REACT_APP_API_URL=https://tuo-backend.up.railway.app/api
```

## Esempio Completo

**Backend su Railway:**
- URL: `https://planner-backend.up.railway.app`
- Health check: `https://planner-backend.up.railway.app/api/health`

**Frontend su Vercel:**
- URL: `https://planner-turni.vercel.app`
- Variabile: `REACT_APP_API_URL=https://planner-backend.up.railway.app/api`

## Supporto

Se hai problemi:
1. Controlla i log su Railway/Render
2. Controlla i log su Vercel (Deployments → Logs)
3. Apri la console del browser (F12) per vedere errori specifici

