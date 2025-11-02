# Configurazione Vercel - Fix Errore 401

## Problema
Il frontend su Vercel mostra errore 401 perché non riesce a connettersi al backend.

## Cause Possibili
1. **Backend non deployato** - Il backend deve essere deployato su un servizio separato
2. **Variabile d'ambiente mancante** - `REACT_APP_API_URL` non configurata su Vercel

## Soluzione Passo-Passo

### Step 1: Deploy del Backend

Devi deployare il backend su uno di questi servizi:
- **Railway** (consigliato): https://railway.app
- **Render**: https://render.com
- **Heroku**: https://heroku.com

#### Deploy su Railway (Consigliato):

1. Vai su https://railway.app e registrati
2. Crea un nuovo progetto
3. Connetti il repository GitHub
4. Aggiungi un nuovo servizio → **GitHub Repo**
5. Seleziona la cartella `server` come root directory
6. Railway rileva automaticamente Node.js
7. Aggiungi le variabili d'ambiente:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   JWT_SECRET=your-secret-key-here
   NODE_ENV=production
   ```
8. Railway ti darà un URL tipo: `https://tuo-progetto.up.railway.app`
9. Il backend sarà disponibile su: `https://tuo-progetto.up.railway.app/api`

### Step 2: Configura Variabile d'Ambiente su Vercel

1. **Vai sul Dashboard Vercel**: https://vercel.com/dashboard
2. **Seleziona il progetto** `planner-turni` (o il nome del tuo progetto)
3. **Clicca su "Settings"** (Impostazioni) nella barra superiore
4. **Clicca su "Environment Variables"** nel menu laterale
5. **Aggiungi nuova variabile**:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://tuo-backend-url.up.railway.app/api` (sostituisci con il tuo URL reale)
   - **Seleziona tutti gli ambienti**: 
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
6. **Clicca "Save"**
7. **Vai su "Deployments"**
8. **Trova il deployment più recente**
9. **Clicca sui tre puntini (⋯)** → **"Redeploy"**
10. **Seleziona "Use existing Build Cache"** → **"Redeploy"**

### Step 3: Verifica

1. Dopo il redeploy (circa 1-2 minuti), apri l'URL del tuo sito Vercel
2. Apri la console del browser (F12 → Console)
3. Prova a fare login
4. Controlla che le chiamate API vadano all'URL corretto del backend

## Esempio di Configurazione

Se il tuo backend è su Railway con URL: `https://planner-backend-production.up.railway.app`

La variabile d'ambiente su Vercel deve essere:
```
REACT_APP_API_URL=https://planner-backend-production.up.railway.app/api
```

## Verifica che il Backend Funzioni

Prima di configurare Vercel, verifica che il backend sia online:
1. Apri il browser
2. Vai su: `https://tuo-backend-url.up.railway.app/api/health`
3. Dovresti vedere: `{"status":"OK","message":"Server funzionante"}`

## Troubleshooting

### Errore ancora 401 dopo configurazione:
- ✅ Verifica che il backend sia online
- ✅ Verifica che l'URL nella variabile d'ambiente sia corretto (con `/api` alla fine)
- ✅ Verifica che il backend accetti richieste CORS (già configurato nel codice)
- ✅ Controlla i log di Vercel e del backend per errori

### Errore CORS:
- Il backend ha già `cors()` configurato, ma se hai problemi, aggiungi al backend:
  ```javascript
  app.use(cors({
    origin: ['https://tuo-frontend.vercel.app'],
    credentials: true
  }));
  ```

## Domande Frequenti

**Q: Devo deployare sia frontend che backend su Vercel?**  
A: No, solo il frontend va su Vercel. Il backend va su Railway/Render/Heroku.

**Q: Posso usare lo stesso database di sviluppo?**  
A: No, per produzione serve un database separato. Railway/Render offrono database PostgreSQL.

**Q: Il backend funziona localmente ma non in produzione?**  
A: Verifica le variabili d'ambiente del backend (DATABASE_URL, JWT_SECRET, etc.)

