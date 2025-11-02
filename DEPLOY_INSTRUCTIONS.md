# Istruzioni per il Deploy su Vercel

## Problema Attuale
Il frontend su Vercel non riesce a connettersi al backend perché manca la variabile d'ambiente `REACT_APP_API_URL`.

## Soluzione

### 1. Deploy del Backend (se non già fatto)

Il backend deve essere deployato su un servizio separato. Opzioni consigliate:
- **Railway** (consigliato): https://railway.app
- **Render**: https://render.com
- **Heroku**: https://heroku.com

#### Deploy su Railway (Esempio):
1. Vai su https://railway.app
2. Crea un nuovo progetto
3. Connetti il repository GitHub
4. Seleziona la cartella `server` come root
5. Railway rileva automaticamente Node.js
6. Aggiungi le variabili d'ambiente necessarie:
   - `DATABASE_URL` (o le credenziali PostgreSQL)
   - `JWT_SECRET`
   - `PORT` (Railway lo imposta automaticamente)
7. Railway ti darà un URL tipo: `https://tuo-progetto.up.railway.app`

### 2. Configurazione Variabili d'Ambiente su Vercel

1. Vai sul dashboard di Vercel: https://vercel.com/dashboard
2. Seleziona il progetto `planner-turni`
3. Vai su **Settings** → **Environment Variables**
4. Aggiungi la variabile:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://tuo-backend-url.railway.app/api` (o l'URL del tuo backend)
   - Seleziona tutti gli ambienti: Production, Preview, Development
5. Clicca **Save**
6. Vai su **Deployments** e clicca sui tre puntini del deployment più recente
7. Seleziona **Redeploy** per applicare le nuove variabili

### 3. Verifica

Dopo il redeploy, il frontend dovrebbe connettersi correttamente al backend.

## Note Importanti

- Assicurati che il backend abbia CORS configurato per accettare richieste dal dominio Vercel
- Verifica che il backend sia effettivamente online e raggiungibile
- Controlla i log su Vercel e sul servizio del backend per eventuali errori

## URL di Esempio

Se il tuo backend è su Railway:
```
REACT_APP_API_URL=https://planner-backend.up.railway.app/api
```

Se il tuo backend è su Render:
```
REACT_APP_API_URL=https://planner-backend.onrender.com/api
```

## Verifica della Configurazione

Dopo aver configurato la variabile d'ambiente, puoi verificare che sia corretta:
1. Vai sul deployment su Vercel
2. Apri la console del browser (F12)
3. Controlla che le chiamate API vengano fatte all'URL corretto del backend

