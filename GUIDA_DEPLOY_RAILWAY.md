# 🚂 Guida Completa: Deploy Backend su Railway

## Prerequisiti
- ✅ Account GitHub (per connettere il repository)
- ✅ Account Supabase con database configurato
- ✅ Connection string Supabase pronta

## Step 1: Crea Account Railway

1. Vai su **https://railway.app**
2. Clicca su **"Start a New Project"** o **"Login"**
3. **Scegli "Login with GitHub"** (consigliato)
4. Autorizza Railway ad accedere ai tuoi repository GitHub

## Step 2: Crea Nuovo Progetto

1. Una volta dentro Railway, clicca su **"New Project"** (in alto a destra)
2. Seleziona **"Deploy from GitHub repo"**
3. Se ti chiede di installare l'app GitHub:
   - Clicca **"Configure GitHub App"**
   - Seleziona il repository **"Planner-Turni"** (o il nome del tuo repo)
   - Autorizza l'accesso
4. Seleziona il repository **"ADVPRO-C/Planner-Turni"** (o il tuo)
5. Railway inizierà a scansionare il progetto

## Step 3: Configura il Servizio Backend

1. Railway ti chiederà cosa deployare
2. **IMPORTANTE**: Non usare il rilevamento automatico
3. Clicca su **"Add Service"** → **"GitHub Repo"**
4. Seleziona di nuovo il repository
5. Railway creerà un servizio

### Configura la Root Directory ⚠️ IMPORTANTE

1. Clicca sul servizio appena creato
2. Vai su **"Settings"** (impostazioni)
3. Scorri fino a **"Source"**
4. In **"Root Directory"**, inserisci: **`server`**
5. Clicca **"Save"**

**⚠️ CRITICO**: Se non configuri la Root Directory, Railway proverà a buildare il frontend e fallirà!

## Step 4: Configura le Variabili d'Ambiente

1. Nel servizio, vai su **"Variables"** (nella barra laterale)
2. Clicca su **"New Variable"** per ogni variabile

### Variabile 1: DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**: 
  ```
  postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres
  ```
- Clicca **"Add"**

### Variabile 2: JWT_SECRET
- **Name**: `JWT_SECRET`
- **Value**: Genera un secret sicuro (almeno 32 caratteri, esempio):
  ```
  planner-turni-jwt-secret-2024-super-sicuro-minimo-32-caratteri
  ```
- Clicca **"Add"**

### Variabile 3: NODE_ENV
- **Name**: `NODE_ENV`
- **Value**: `production`
- Clicca **"Add"**

### Variabile 4: PORT (Opzionale)
- **Name**: `PORT`
- **Value**: `5001`
- Clicca **"Add"**

**Nota**: Railway gestisce automaticamente la porta, ma è meglio specificarla.

## Step 5: Verifica la Build Configuration

1. Nel servizio, vai su **"Settings"**
2. Verifica che:
   - **Root Directory**: `server` ⚠️ **DEVE essere impostato!**
   - **Build Command**: Lascia vuoto o `npm install`
   - **Start Command**: `npm start` (dal package.json del server)

**⚠️ IMPORTANTE**: 
- Se la Root Directory NON è `server`, Railway proverà a buildare il frontend e fallirà
- Railway dovrebbe rilevare automaticamente Node.js dalla cartella `server`
- Se vedi errori di build del frontend, controlla che Root Directory sia `server`

## Step 6: Avvia il Deploy

1. Railway dovrebbe avviare automaticamente il deploy dopo aver salvato le variabili
2. Se non parte, vai su **"Deployments"** e clicca **"Redeploy"**
3. Aspetta che il deploy finisca (circa 2-3 minuti)
4. Monitora i log in tempo reale

## Step 7: Ottieni l'URL del Backend

1. Quando il deploy è completato, vai su **"Settings"**
2. Nella sezione **"Networking"**, trova **"Domain"**
3. Railway assegna automaticamente un URL tipo:
   - `https://tuo-progetto-production.up.railway.app`
4. **Copia questo URL** - ti servirà per Vercel

### Testa il Backend

1. Apri nel browser: `https://tuo-url.up.railway.app/api/health`
2. Dovresti vedere:
   ```json
   {"status":"OK","message":"Server funzionante"}
   ```

Se vedi questo, il backend funziona! 🎉

## Step 8: Configura CORS (se necessario)

Se hai problemi CORS, modifica `server/index.js`:

```javascript
app.use(cors({
  origin: [
    'https://tuo-frontend.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));
```

Ma dovrebbe già funzionare con `app.use(cors())` che accetta tutti gli origin.

## Step 9: Configura Vercel (Frontend)

1. Vai su **https://vercel.com/dashboard**
2. Seleziona il progetto del frontend
3. Vai su **"Settings"** → **"Environment Variables"**
4. Clicca **"Add New"**
5. Configura:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://tuo-url.up.railway.app/api` (sostituisci con il tuo URL Railway)
   - Seleziona: ✅ Production, ✅ Preview, ✅ Development
6. Clicca **"Save"**

## Step 10: Redeploy Frontend su Vercel

1. Vai su **"Deployments"** su Vercel
2. Trova il deployment più recente
3. Clicca sui **tre puntini (⋯)**
4. Seleziona **"Redeploy"**
5. Seleziona **"Use existing Build Cache"**
6. Clicca **"Redeploy"**

## Step 11: Verifica Finale

1. Aspetta che il redeploy finisca (1-2 minuti)
2. Apri l'URL del frontend su Vercel
3. Prova a fare login con:
   - Email: `arena@advpro.it`
   - Password: `Uditore20`
4. Se funziona, hai completato il deploy! 🎉

## Troubleshooting

### Il backend non parte
- ✅ Controlla i log su Railway (tab "Deployments" → clicca sul deployment → "View Logs")
- ✅ Verifica che le variabili d'ambiente siano corrette
- ✅ Verifica che `Root Directory` sia impostato su `server`

### Errore di connessione database
- ✅ Verifica che `DATABASE_URL` sia corretto
- ✅ Verifica che la password nel connection string sia quella giusta
- ✅ Controlla che Supabase accetti connessioni esterne

### Errore 401 sul frontend
- ✅ Verifica che `REACT_APP_API_URL` su Vercel sia corretto (con `/api` alla fine)
- ✅ Verifica che il backend risponda a `/api/health`
- ✅ Controlla la console del browser (F12) per errori specifici

### Errore CORS
- ✅ Il backend ha già `cors()` configurato
- ✅ Se necessario, aggiungi gli origin specifici come mostrato sopra

## Checklist Finale

- [ ] Account Railway creato
- [ ] Progetto Railway creato e connesso a GitHub
- [ ] Root Directory impostata su `server`
- [ ] Variabile `DATABASE_URL` configurata
- [ ] Variabile `JWT_SECRET` configurata
- [ ] Variabile `NODE_ENV` configurata
- [ ] Deploy completato con successo
- [ ] Test `/api/health` funziona
- [ ] URL backend copiato
- [ ] Variabile `REACT_APP_API_URL` configurata su Vercel
- [ ] Frontend redeployato su Vercel
- [ ] Login funziona correttamente

## Costi

- **Railway**: Tier gratuito generoso (500 ore/mese, $5 di crediti)
- **Vercel**: Gratuito per progetti personali
- **Supabase**: Tier gratuito generoso

## Supporto

Se hai problemi:
1. Controlla i log su Railway
2. Controlla i log su Vercel
3. Apri la console del browser (F12) per errori

Buon deploy! 🚀

