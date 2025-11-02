# 📂 Guida Dettagliata: Configurare Root Directory su Railway

## 🎯 Obiettivo
Configurare Railway per usare la cartella `server` come root, così Railway builda il backend invece del frontend.

---

## 📍 PASSO 1: Accedi a Railway e Trova il Tuo Servizio

1. **Apri il browser** e vai su: **https://railway.app**
2. **Effettua il login** se necessario
3. **Vedrai una lista di progetti** (o un progetto singolo)

4. **Clicca sul progetto** che contiene il tuo backend
   - Se vedi più progetti, cerca quello che hai creato per il deploy
   - Di solito ha un nome tipo "planner-turni" o simile

5. **Ora vedrai una o più card/box** che rappresentano i servizi
   - Potrebbe chiamarsi "web", "api", "planner-backend" o altro
   - **CLICCA sul servizio** (la card/box del backend)

---

## 📍 PASSO 2: Trova la Sezione Settings

Una volta dentro il servizio, hai diverse opzioni per trovare Settings:

### Opzione A: Sidebar Sinistra (più comune)

1. **Guarda la sidebar sinistra** della schermata
   - Se non la vedi, cerca un **menu hamburger (☰)** o un'**icona con 3 linee** in alto a sinistra e cliccalo

2. **Nella sidebar**, cerca una voce chiamata:
   - **"Settings"** (Impostazioni)
   - **"⚙️ Settings"** (con icona ingranaggio)
   - **"Configure"** (Configura)

3. **CLICCA su "Settings"**

### Opzione B: Menu a 3 Puntini

1. **Cerca i 3 puntini (⋯)** in alto a destra della card del servizio
2. **Clicca sui 3 puntini**
3. **Seleziona "Settings"** dal menu a tendina

### Opzione C: Tab nella Barra Superiore

1. **Guarda la barra superiore** della schermata del servizio
2. **Cerca tab come**:
   - Overview
   - Deployments
   - **Settings** ← CLICCA QUI
   - Variables
   - Logs

---

## 📍 PASSO 3: Trova "Source" o "Build & Deploy"

Una volta dentro **Settings**, vedrai diverse sezioni. Cerca:

### Sezione "Source" (più comune)
- Trovata subito dopo "General" o all'inizio
- Titolo: **"Source"** o **"Source Code"**

### Oppure Sezione "Build & Deploy"
- Può chiamarsi anche **"Build Settings"** o **"Deploy Settings"**
- Contiene le impostazioni di build

### Se non trovi né "Source" né "Build & Deploy":
1. **Scorri la pagina Settings** verso il basso
2. **Cerca sezioni come**:
   - "Build"
   - "Deploy"
   - "Configuration"
   - "General"

---

## 📍 PASSO 4: Trova il Campo "Root Directory"

Dentro la sezione "Source" o "Build & Deploy", cerca un campo chiamato:

### Possibili nomi del campo:
- **"Root Directory"** (più comune)
- **"Working Directory"**
- **"Base Directory"**
- **"Source Directory"**

### Come appare:
- Una **casella di testo** vuota o con un valore esistente
- Potrebbe avere un'**icona di cartella 📁** accanto
- Sotto potrebbe esserci un'etichetta tipo: *"Directory from which to run build commands"*

---

## 📍 PASSO 5: Imposta la Root Directory

1. **Clicca nella casella di testo** "Root Directory"
2. **Cancella qualsiasi valore esistente** (se c'è)
3. **Scrivi esattamente**: `server`
   - ⚠️ **IMPORTANTE**: Scrivilo in minuscolo: `server`
   - ⚠️ **NON scrivere**: `/server` o `./server` o `server/`
   - ⚠️ **Solo**: `server`

4. **Verifica** che nella casella ci sia scritto solo: `server`

---

## 📍 PASSO 6: Salva le Modifiche

1. **Cerca un pulsante "Save"** o **"Update"** o **"Apply"**
   - Di solito è in fondo alla sezione "Source"
   - Oppure in alto a destra della pagina Settings

2. **CLICCA su "Save"** (o "Update"/"Apply")

3. **Dovresti vedere un messaggio** tipo:
   - "Settings updated"
   - "Configuration saved"
   - Oppure semplicemente la pagina si aggiorna

---

## 📍 PASSO 7: Verifica e Redeploy

1. **Torna alla vista principale del servizio** (clicca sul nome del servizio o "Overview")

2. **Vai su "Deployments"** (dalla sidebar o tab)

3. **Clicca "Redeploy"** o **"Deploy"**
   - Railway ricostruirà il servizio usando la nuova root directory

4. **Aspetta che finisca il deploy** (1-2 minuti)

5. **Controlla i log** per verificare che:
   - Il build parta dalla cartella `server`
   - Veda il file `server/package.json`
   - Esegua `npm install` nella cartella `server`
   - **NON** provi a buildare il frontend

---

## ✅ Verifica che Funzioni

### Segni che la configurazione è corretta:

**Nei log di build dovresti vedere:**
```
✓ Installing dependencies from server/package.json
✓ Building from server directory
✓ Starting with: npm start (from server/)
```

**NON dovresti vedere:**
```
❌ cd client && npm install
❌ react-scripts build
❌ Building React app
```

---

## 🆘 Problemi Comuni

### "Non trovo Settings"
- **Problema**: Settings potrebbe essere nascosto o avere un nome diverso
- **Soluzione**: 
  - Cerca "Configure" o "⚙️" nella sidebar
  - Oppure clicca sui 3 puntini (⋯) sul servizio

### "Non trovo Root Directory"
- **Problema**: Potrebbe chiamarsi diversamente
- **Soluzione**: 
  - Cerca "Working Directory" o "Base Directory"
  - Controlla tutte le sezioni in Settings
  - Scorri verso il basso in Settings

### "La casella è disabilitata/grigia"
- **Problema**: Potrebbe essere una configurazione del progetto, non del servizio
- **Soluzione**: 
  - Vai su Settings del **progetto** (non del servizio)
  - Oppure elimina e ricrea il servizio con la configurazione corretta

### "Dopo aver salvato, Railway continua a buildare il frontend"
- **Problema**: Potrebbe non aver applicato le modifiche
- **Soluzione**: 
  - Verifica che `server` sia scritto esattamente così (minuscolo, senza slash)
  - Fai un **Redeploy** completo
  - Controlla i log del deploy per vedere quale directory sta usando

---

## 📸 Cosa Dovresti Vedere

### Prima (SBAGLIATO):
```
Root Directory: [vuoto o "."]
Build Command: npm run build
```

### Dopo (CORRETTO):
```
Root Directory: server
Build Command: npm install (o vuoto)
Start Command: npm start
```

---

## 🎯 Riassunto Rapido

1. Railway → Il tuo servizio → **Settings**
2. Cerca **"Source"** o **"Build & Deploy"**
3. Trova **"Root Directory"**
4. Scrivi: `server`
5. **Save**
6. **Redeploy**

---

## 💡 Nota Importante

Se hai configurato `railway.toml` correttamente, Railway dovrebbe usare automaticamente `server` come root directory. Ma se non funziona, impostare manualmente "Root Directory" nella UI è la soluzione più sicura.

---

**Se hai ancora problemi, descrivi cosa vedi nella schermata Settings e ti aiuto a trovare il campo giusto!** 🚀

