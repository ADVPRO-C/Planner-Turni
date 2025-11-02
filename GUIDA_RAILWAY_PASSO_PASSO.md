# 🚂 Guida Passo-Passo Railway - CON SCREENSHOT DESCRIZIONI

## 📱 Obiettivo
Configurare le variabili d'ambiente su Railway per far funzionare l'app da mobile.

## 🎯 Cosa Devi Fare (5 Minuti)

### FASE 1: Trova l'URL del Backend Railway

1. **Apri il browser** e vai su: **https://railway.app**
2. **Effettua il login** se necessario
3. Vedrai una **lista di progetti** (o un progetto singolo)

4. **Clicca sul progetto** che contiene il tuo backend
   - Se vedi più progetti, cerca quello che hai creato per il deploy del backend
   - Di solito ha un nome tipo "planner-turni" o simile

5. **Clicca sul servizio** (service) all'interno del progetto
   - Vedrai una card o un box con il nome del servizio
   - Potrebbe chiamarsi "web", "api", o il nome che hai dato

6. **Cerca l'URL pubblico**:
   - **Opzione A**: In alto nella card del servizio, dovresti vedere un link tipo:
     ```
     https://tuo-progetto.up.railway.app
     ```
   - **Opzione B**: Vai su **"Settings"** (Impostazioni) → **"Networking"** o **"Domain"**
   - **Opzione C**: Vai su **"Settings"** → **"Generate Domain"** se non ce l'hai

7. **Copia l'URL completo** (esempio: `https://planner-backend-production.up.railway.app`)
   - ⚠️ **NON copiare** `/api` alla fine, solo l'URL base
   - Scrivilo da qualche parte perché ti serve dopo

---

### FASE 2: Configura Variabili su Railway

1. **Sempre nella vista del servizio Railway**, guarda la **sidebar sinistra**
   - Se non vedi la sidebar, cerca un menu con icone o un pulsante hamburger (☰)

2. **Clicca su "Variables"** o **"Environment Variables"**
   - Potrebbe essere un'icona con un ingranaggio ⚙️ o "Env" o "Variables"
   - O cerca nella barra in alto se c'è una tab "Variables"

3. **Vedrai una lista di variabili** (potrebbe essere vuota o avere già alcune variabili)

4. **Clicca sul pulsante "New Variable"** o **"Add Variable"** o **"+"**
   - Di solito è in alto a destra o in basso

5. **Aggiungi la prima variabile**:
   - **Nome campo "Name" o "Key"**: `DATABASE_URL`
   - **Nome campo "Value"**: Incolla questo esatto:
     ```
     postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres
     ```
   - **Environment**: Seleziona tutte le opzioni disponibili (Production, Preview, Development)
   - Clicca **"Add"** o **"Save"**

6. **Aggiungi la seconda variabile**:
   - Clicca di nuovo **"New Variable"**
   - **Name**: `JWT_SECRET`
   - **Value**: 
     ```
     planner-turni-jwt-secret-2024-super-sicuro-minimo-32-caratteri-lungo
     ```
   - **Environment**: Seleziona tutte
   - Clicca **"Add"** o **"Save"**

7. **Aggiungi la terza variabile**:
   - Clicca di nuovo **"New Variable"**
   - **Name**: `NODE_ENV`
   - **Value**: `production`
   - **Environment**: Seleziona tutte
   - Clicca **"Add"** o **"Save"**

8. **Verifica** che vedi 3 variabili nella lista:
   - ✅ `DATABASE_URL`
   - ✅ `JWT_SECRET`
   - ✅ `NODE_ENV`

---

### FASE 3: Verifica che il Backend Funzioni

1. **Torna alla vista principale del servizio** (clicca sul nome del servizio o "Overview")

2. **Trova l'URL pubblico** che hai copiato prima (es: `https://tuo-progetto.up.railway.app`)

3. **Apri un nuovo tab del browser** e vai a:
   ```
   https://tuo-progetto.up.railway.app/api/health
   ```
   (Sostituisci con il tuo URL reale)

4. **Dovresti vedere**:
   ```json
   {"status":"OK","message":"Server funzionante"}
   ```

5. **Se vedi questo**, il backend è configurato correttamente! ✅

---

### FASE 4: Configura Vercel (Frontend)

1. **Apri un nuovo tab** e vai su: **https://vercel.com/dashboard**

2. **Effettua il login** se necessario

3. **Clicca sul progetto** del frontend (planner-turni o simile)

4. **Guarda la barra in alto**, dovresti vedere tab come:
   - Overview
   - Deployments
   - Settings ← **CLICCA QUI**
   - Analytics
   - ecc.

5. **Clicca su "Settings"**

6. **Nel menu a sinistra**, cerca e clicca su **"Environment Variables"**

7. **Vedrai una lista di variabili** (potrebbe essere vuota)

8. **Clicca "Add New"** o **"Add Variable"**

9. **Compila il form**:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://tuo-backend-url.up.railway.app/api`
     - ⚠️ **SOSTITUISCI** `tuo-backend-url.up.railway.app` con l'URL che hai copiato da Railway
     - ⚠️ **AGGIUNGI** `/api` alla fine!
     - Esempio completo: `https://planner-backend-production.up.railway.app/api`
   - **Environments**: Seleziona tutte e tre:
     - ✅ Production
     - ✅ Preview
     - ✅ Development (opzionale)

10. **Clicca "Save"**

11. **Verifica** che la variabile sia nella lista

---

### FASE 5: Redeploy Frontend

1. **Resta su Vercel**, vai su **"Deployments"** (dalla barra in alto)

2. **Trova l'ultimo deployment** (il più recente in alto)

3. **Clicca sui tre puntini (⋯)** accanto al deployment

4. **Seleziona "Redeploy"**

5. **Si aprirà un popup**, deseleziona **"Use existing Build Cache"**
   - Questo è importante per includere la nuova variabile!

6. **Clicca "Redeploy"**

7. **Aspetta** che finisca il deploy (di solito 1-2 minuti)

---

### FASE 6: Test Finale

1. **Apri l'app deployata su Vercel** (l'URL del frontend)

2. **Apri la Console del Browser**:
   - Chrome/Edge: `F12` → Tab "Console"
   - Safari: `Cmd+Option+I` → Tab "Console"
   - Firefox: `F12` → Tab "Console"

3. **Dovresti vedere**:
   ```
   🔗 API Base URL configurato: https://tuo-backend-url.up.railway.app/api
   🔍 REACT_APP_API_URL env: https://tuo-backend-url.up.railway.app/api
   ```

4. **Prova a fare login**:
   - Se funziona, tutto è OK! ✅
   - Se non funziona, controlla gli errori nella console

5. **Prova da mobile**:
   - Apri l'app dal browser mobile
   - Dovrebbe funzionare ora! ✅

---

## 🆘 Problemi Comuni

### "Non trovo la sidebar su Railway"
- **Soluzione**: Clicca sul nome del servizio/progetto per entrare nella vista dettaglio
- La sidebar appare solo quando sei dentro un servizio specifico

### "Non vedo 'Variables' nella sidebar"
- **Cerca**: "Settings" → poi "Variables" dentro Settings
- **Oppure**: Guarda la barra in alto, potrebbe esserci una tab "Variables"

### "Non trovo l'URL pubblico su Railway"
- **Vai su**: Settings → Networking
- **Oppure**: Settings → Generate Domain (per creare un dominio)

### "La variabile REACT_APP_API_URL non funziona su Vercel"
- **Verifica**: L'URL termina con `/api`? (es: `...railway.app/api`)
- **Verifica**: Hai fatto il redeploy DOPO aver aggiunto la variabile?
- **Verifica**: Hai deselezionato "Use existing Build Cache" durante il redeploy?

### "Il backend restituisce errore 401"
- **Verifica**: Le variabili su Railway sono salvate correttamente?
- **Verifica**: Il backend è accessibile? (prova `/api/health`)
- **Verifica**: `JWT_SECRET` è configurato su Railway?

---

## ✅ Checklist Finale

Prima di considerare tutto fatto, verifica:

- [ ] Backend Railway ha 3 variabili d'ambiente (`DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`)
- [ ] Backend Railway è accessibile pubblicamente (test `/api/health` funziona)
- [ ] Vercel ha la variabile `REACT_APP_API_URL` configurata
- [ ] `REACT_APP_API_URL` punta a `https://tuo-backend.up.railway.app/api` (con `/api`)
- [ ] Frontend è stato redeployato su Vercel dopo aver aggiunto la variabile
- [ ] Console browser mostra l'URL API corretto
- [ ] Login funziona da PC
- [ ] Login funziona da mobile

---

## 📞 Se Hai Ancora Problemi

Se dopo aver seguito tutti questi passi qualcosa non funziona:

1. **Screenshot**: Fai screenshot delle schermate Railway e Vercel dove sei bloccato
2. **Errori**: Copia gli errori dalla console del browser
3. **URL**: Condividi gli URL di Railway e Vercel (anche se parziali, nascondi informazioni sensibili)

E posso aiutarti più nello specifico! 🚀

