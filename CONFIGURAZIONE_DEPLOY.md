# Configurazione Deploy - Planner Turni

## Connection String Database Supabase

```
postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres
```

## Variabili d'Ambiente per Railway (Backend)

Aggiungi queste variabili su Railway quando fai il deploy:

```
DATABASE_URL=postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres
JWT_SECRET=un-secret-super-sicuro-e-lungo-per-jwt-minimo-32-caratteri
NODE_ENV=production
PORT=5001
```

## Variabili d'Ambiente per Vercel (Frontend)

Aggiungi questa variabile su Vercel:

```
REACT_APP_API_URL=https://tuo-backend-url.up.railway.app/api
```

**Sostituisci** `https://tuo-backend-url.up.railway.app` con l'URL reale del tuo backend Railway dopo il deploy.

## Passi per il Deploy

### 1. Deploy Backend su Railway

1. Vai su https://railway.app
2. Crea nuovo progetto → Deploy from GitHub repo
3. Seleziona la cartella `server` come root
4. Aggiungi le variabili d'ambiente sopra
5. Railway ti darà un URL tipo: `https://tuo-progetto.up.railway.app`

### 2. Verifica Backend

Apri: `https://tuo-progetto.up.railway.app/api/health`

Dovresti vedere: `{"status":"OK","message":"Server funzionante"}`

### 3. Configura Vercel

1. Vai su https://vercel.com/dashboard
2. Settings → Environment Variables
3. Aggiungi `REACT_APP_API_URL` con l'URL del backend Railway
4. Redeploy il frontend

## Credenziali Database

- **Host**: `db.wwcgryzbgvxfviwcjnkg.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: `2vQ-i60MqwHG`

