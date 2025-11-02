# ✅ Verifica Configurazione Railway

## File di Configurazione Creati

### 1. `railway.toml` (root del progetto)
```toml
[build]
builder = "nixpacks"
buildCommand = "cd server && npm install"

[deploy]
startCommand = "cd server && npm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 100
```
✅ **Stato**: Configurato correttamente
✅ **Funzione**: Railway leggerà automaticamente questo file per configurare build e deploy

### 2. `server/Procfile`
```
web: node index.js
```
✅ **Stato**: Configurato correttamente
✅ **Funzione**: Backup se Railway non usa `railway.toml`

### 3. `server/nixpacks.toml`
```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm install"]

[phases.build]
cmds = []

[start]
cmd = "node index.js"
```
✅ **Stato**: Configurato correttamente
✅ **Funzione**: Configurazione specifica per Nixpacks builder

### 4. `.railwayignore`
```
client/
node_modules/
...
```
✅ **Stato**: Configurato correttamente
✅ **Funzione**: Esclude la cartella `client` dal deployment

### 5. `server/index.js` - HOST Configuration
```javascript
const isProduction = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT || process.env.PORT;
const HOST = process.env.HOST || (isProduction ? "0.0.0.0" : "127.0.0.1");
```
✅ **Stato**: Aggiornato per rilevare automaticamente Railway
✅ **Funzione**: Il server ascolta su `0.0.0.0` quando è in produzione (Railway)

## ✅ Checklist Pre-Deploy

### Su Railway Dashboard:

1. **Root Directory** (OPZIONALE se usi `railway.toml`):
   - Se vedi l'opzione, imposta: `server`
   - Se non la vedi, `railway.toml` gestirà tutto automaticamente

2. **Build Command** (dovrebbe essere automatico):
   - Dovrebbe essere: `cd server && npm install` (da `railway.toml`)

3. **Start Command** (dovrebbe essere automatico):
   - Dovrebbe essere: `cd server && npm start` (da `railway.toml`)

4. **Variables** (DA CONFIGURARE MANUALMENTE):
   - ✅ `DATABASE_URL`: `postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres`
   - ✅ `JWT_SECRET`: `planner-turni-jwt-secret-2024-super-sicuro-minimo-32-caratteri-lungo`
   - ✅ `NODE_ENV`: `production`

## 🚀 Cosa Fare Ora

1. **Push su Git** (se non l'hai già fatto):
   ```bash
   git add .
   git commit -m "Configurazione Railway completa"
   git push
   ```

2. **Su Railway**:
   - Se hai già un servizio, clicca **"Redeploy"**
   - Se non hai ancora un servizio, crea un nuovo servizio da GitHub repo
   - Railway dovrebbe leggere automaticamente `railway.toml`

3. **Verifica Variables**:
   - Vai su **Variables** nella sidebar del servizio
   - Aggiungi le 3 variabili d'ambiente sopra elencate

4. **Monitora i Log**:
   - Vai su **Deployments** → Clicca sul deployment più recente
   - Guarda i log per vedere se il build funziona
   - Dovresti vedere: `npm install` nella cartella `server`

## 🔍 Debugging

### Se il Build Fallisce:

1. **Controlla i log** per vedere quale comando viene eseguito
2. Se vedi `cd client && npm install`, significa che Railway non sta usando `railway.toml`
   - **Soluzione**: Imposta manualmente **Root Directory** = `server` in Settings

### Se il Server Non Parte:

1. Controlla che `PORT` sia settato (Railway lo fa automaticamente)
2. Verifica che `DATABASE_URL` sia corretto
3. Controlla i log per errori di connessione al database

### Se Vedi Errori del Frontend:

- Railway sta buildando la cartella sbagliata
- **Soluzione**: Imposta **Root Directory** = `server` in Settings

## 📝 Note Importanti

- `railway.toml` ha la priorità, ma se Railway non lo legge, usa le impostazioni manuali
- Se imposti manualmente **Root Directory** = `server`, il `startCommand` dovrebbe essere solo `npm start` (non `cd server && npm start`)
- Il file `.railwayignore` previene che Railway provi a buildare il `client/`

## ✅ Tutto Pronto!

Tutti i file di configurazione sono stati creati e verificati. Railway dovrebbe:
1. ✅ Leggere `railway.toml` automaticamente
2. ✅ Eseguire `cd server && npm install` durante il build
3. ✅ Eseguire `cd server && npm start` per avviare il server
4. ✅ Ascoltare su `0.0.0.0` per accettare connessioni esterne

**Prossimo passo**: Configura le **Variables** su Railway e fai il deploy!

