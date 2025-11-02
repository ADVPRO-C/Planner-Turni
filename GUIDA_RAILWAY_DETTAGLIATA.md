# 🚂 Guida Dettagliata Railway - Dove Trovare le Impostazioni

## 🔍 Step-by-Step: Come Configurare Railway

### Step 1: Accedi a Railway e Crea il Progetto

1. Vai su **https://railway.app**
2. Clicca **"Start a New Project"** o **"New"** (in alto a destra)
3. Seleziona **"Deploy from GitHub repo"**
4. Autorizza Railway ad accedere a GitHub (se richiesto)
5. Seleziona il repository: **`ADVPRO-C/Planner-Turni`** (o il tuo)
6. Railway creerà automaticamente un servizio

### Step 2: Trova le Impostazioni del Servizio

Railway ha cambiato l'interfaccia, quindi ecco dove trovare le impostazioni:

#### Metodo A: Dalla Dashboard del Progetto

1. Dopo aver creato il progetto, vedrai una **card con il nome del servizio**
2. **Clicca sul nome del servizio** (non sui tre puntini, ma direttamente sulla card)
3. Si aprirà la vista del servizio con diverse tab

#### Metodo B: Dalla Sidebar

1. Nella vista del servizio, guarda la **sidebar sinistra**
2. Dovresti vedere:
   - 📊 **Metrics** (Metriche)
   - 📝 **Deployments** (Deploy)
   - ⚙️ **Settings** (Impostazioni) ← **QUESTO!**
   - 📋 **Variables** (Variabili)
   - 📄 **Logs** (Log)
3. **Clicca su "Settings"**

#### Metodo C: Menu a Tre Puntini

1. Sulla card del servizio, cerca i **tre puntini (⋯)** in alto a destra
2. Clicca sui tre puntini
3. Seleziona **"Settings"** dal menu

### Step 3: Imposta la Root Directory

Una volta dentro **Settings**:

1. Scorri verso il basso fino a trovare la sezione **"Source"** o **"Build & Deploy"**
2. Cerca il campo **"Root Directory"** o **"Working Directory"**
3. **Elimina qualsiasi valore esistente** e inserisci: **`server`**
4. Clicca **"Save"** o **"Update"**

### Step 4: Configura Start Command

Nella stessa sezione Settings:

1. Cerca **"Start Command"** o **"Run Command"**
2. Dovrebbe essere vuoto o avere un valore di default
3. Se vuoto, inserisci: **`npm start`**
4. Oppure: **`node index.js`**
5. Clicca **"Save"**

### Step 5: Configura le Variabili d'Ambiente

1. Dalla sidebar del servizio, clicca su **"Variables"**
2. Oppure vai in **Settings** → **Variables**
3. Clicca **"New Variable"** o **"Add Variable"**
4. Aggiungi:

**Variabile 1:**
- **Key**: `DATABASE_URL`
- **Value**: `postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres`

**Variabile 2:**
- **Key**: `JWT_SECRET`
- **Value**: `planner-turni-jwt-secret-2024-super-sicuro-minimo-32-caratteri-lungo`

**Variabile 3:**
- **Key**: `NODE_ENV`
- **Value**: `production`

5. Per ogni variabile, seleziona gli ambienti (Production, Preview, Development)
6. Clicca **"Add"** o **"Save"** per ogni variabile

### Step 6: Avvia il Deploy

1. Dopo aver configurato tutto, vai su **"Deployments"** nella sidebar
2. Clicca **"Redeploy"** o **"Deploy"**
3. Monitora i log per vedere se funziona

## 🔧 Se Non Trovi le Impostazioni

### Alternativa: Usa il File railway.toml

Ho creato un file `railway.toml` nella root del progetto. Railway dovrebbe leggerlo automaticamente.

Se Railway non rileva automaticamente le impostazioni:

1. Vai su **Settings** → **Build**
2. Cerca **"Nixpacks Configuration"** o **"Build Settings"**
3. Railway dovrebbe usare automaticamente il file `railway.toml`

### Alternativa: Crea un Nuovo Servizio da Zero

Se hai già creato un servizio e non trovi le impostazioni:

1. **Elimina il servizio esistente** (Settings → Danger Zone → Delete)
2. Crea un **nuovo servizio**:
   - Clicca **"New"** → **"GitHub Repo"**
   - Seleziona il repository
   - **Prima di confermare**, cerca un'opzione **"Configure"** o **"Advanced"**
   - Imposta **Root Directory: `server`** prima di creare il servizio

## 📱 Screenshot/Direzioni Visive

L'interfaccia Railway è cambiata, ma generalmente:

```
Dashboard Progetto
  └─ Card Servizio (clicca qui)
      └─ Sidebar Sinistra:
          ├─ Metrics
          ├─ Deployments
          ├─ ⚙️ Settings ← CLICCA QUI
          ├─ Variables
          └─ Logs
              
Settings
  ├─ General
  ├─ Source / Build & Deploy
  │   ├─ Root Directory: [server] ← MODIFICA QUESTO
  │   ├─ Build Command: [vuoto o npm install]
  │   └─ Start Command: [npm start]
  ├─ Variables
  └─ Networking
```

## ✅ Verifica Rapida

Dopo aver configurato:

1. ✅ Root Directory = `server`
2. ✅ Start Command = `npm start`
3. ✅ Variables configurate
4. ✅ Redeploy eseguito

## 🆘 Se Continui ad Avere Problemi

1. **Fammi sapere cosa vedi** nella schermata Settings
2. **Condividi uno screenshot** se possibile
3. **Controlla i log** di deployment per errori specifici

In alternativa, posso aiutarti a creare un **Procfile** o modificare la struttura del progetto per renderlo più compatibile con Railway.

