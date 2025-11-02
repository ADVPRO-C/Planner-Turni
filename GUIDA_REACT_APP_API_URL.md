# 🔗 Guida Completa: Configurare REACT_APP_API_URL su Vercel

## 🎯 Obiettivo
Configurare la variabile `REACT_APP_API_URL` su Vercel per far funzionare l'app da mobile.

---

## 📍 PASSO 1: Trova l'URL del Backend Railway

### 1.1 Accedi a Railway

1. **Apri il browser** e vai su: **https://railway.app**
2. **Effettua il login** se necessario
3. **Clicca sul tuo progetto** (quello che contiene il backend)
4. **Clicca sul servizio** (backend)

### 1.2 Trova l'URL Pubblico

L'URL può essere in diversi posti:

#### Opzione A: Nella Card del Servizio (più comune)
- Guarda la **card/box del servizio**
- Dovresti vedere un **link cliccabile** tipo:
  ```
  https://tuo-progetto.up.railway.app
  ```
- **COPIA QUESTO URL COMPLETO**

#### Opzione B: In Settings → Networking
1. Vai su **Settings** (dalla sidebar)
2. Cerca **"Networking"** o **"Domain"** o **"Public Domain"**
3. Dovresti vedere l'URL tipo:
   ```
   https://tuo-progetto.up.railway.app
   ```
4. **COPIA QUESTO URL**

#### Opzione C: Genera un Dominio (se non ce l'hai)
1. Vai su **Settings** → **Networking**
2. Cerca **"Generate Domain"** o **"Create Domain"**
3. Clicca il pulsante
4. Railway genererà un URL tipo: `https://tuo-progetto.up.railway.app`
5. **COPIA QUESTO URL**

### 1.3 Esempio di URL
Un URL Railway tipico è:
```
https://planner-backend-production.up.railway.app
```

**⚠️ IMPORTANTE**: Copia solo l'URL base, SENZA `/api` alla fine!

---

## 📍 PASSO 2: Testa che il Backend Funzioni

Prima di configurare Vercel, verifica che il backend funzioni:

1. **Apri un nuovo tab del browser**
2. **Vai a**: `https://TUO-URL-RAILWAY.up.railway.app/api/health`
   - Sostituisci `TUO-URL-RAILWAY.up.railway.app` con l'URL che hai copiato
3. **Dovresti vedere**:
   ```json
   {"status":"OK","message":"Server funzionante"}
   ```

**Se vedi questo messaggio, il backend funziona! ✅**

Se vedi un errore, controlla:
- Il backend è deployato correttamente?
- Le variabili d'ambiente su Railway sono configurate?
- I log di Railway mostrano errori?

---

## 📍 PASSO 3: Configura Vercel

### 3.1 Accedi a Vercel

1. **Apri un nuovo tab** e vai su: **https://vercel.com/dashboard**
2. **Effettua il login** se necessario
3. **Vedrai una lista di progetti**

### 3.2 Seleziona il Tuo Progetto Frontend

1. **Clicca sul progetto** del frontend (es: "planner-turni" o simile)
2. Si aprirà la dashboard del progetto

### 3.3 Vai su Settings

Guarda la **barra in alto** della schermata del progetto:

```
┌────────────────────────────────────────────┐
│ Overview │ Deployments │ Settings │ ... │ ← CLICCA SU "Settings"
└────────────────────────────────────────────┘
```

Oppure cerca **"Settings"** nella **sidebar sinistra** se c'è.

### 3.4 Vai su Environment Variables

Una volta dentro **Settings**, vedrai diverse sezioni nel **menu a sinistra**:

```
┌─ Settings ────────────────────────────┐
│                                       │
│  General                              │
│  Environment Variables  ← CLICCA QUI │
│  Build & Development Settings         │
│  Git                                  │
│  ...                                  │
└───────────────────────────────────────┘
```

**CLICCA su "Environment Variables"**

### 3.5 Aggiungi la Nuova Variabile

Ora vedrai:
1. Una **lista di variabili esistenti** (potrebbe essere vuota)
2. Un form per **aggiungere nuove variabili** in alto

#### Compila il Form:

**Campo "Key" o "Name":**
```
REACT_APP_API_URL
```
⚠️ **SCRIVILO ESATTAMENTE COSÌ**: `REACT_APP_API_URL` (maiuscolo, underscore)

**Campo "Value":**
```
https://TUO-URL-RAILWAY.up.railway.app/api
```
⚠️ **IMPORTANTE**:
- Sostituisci `TUO-URL-RAILWAY.up.railway.app` con l'URL reale di Railway che hai copiato
- **AGGIUNGI `/api` alla fine!**

**Esempio completo:**
Se l'URL di Railway è: `https://planner-backend-production.up.railway.app`

Il Value sarà:
```
https://planner-backend-production.up.railway.app/api
```

**Environment:**
Seleziona tutte le checkbox:
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development** (opzionale, ma meglio selezionarla)

### 3.6 Salva

1. **Clicca il pulsante "Add"** o **"Save"** o **"Add Variable"**
2. **Dovresti vedere** la nuova variabile nella lista:
   ```
   REACT_APP_API_URL = https://tuo-url.up.railway.app/api
   ```

---

## 📍 PASSO 4: Redeploy Frontend

⚠️ **IMPORTANTE**: Dopo aver aggiunto la variabile, DEVI fare un redeploy!

### 4.1 Vai su Deployments

1. **Torna alla dashboard del progetto** (clicca sul nome del progetto o "Overview")
2. **Clicca su "Deployments"** (dalla barra in alto o sidebar)

### 4.2 Trova l'Ultimo Deployment

1. **Vedrai una lista di deployment**
2. **Trova l'ultimo** (quello più in alto, più recente)

### 4.3 Redeploy

1. **Clicca sui tre puntini (⋯)** a destra del deployment
   - Oppure passa il mouse sopra il deployment e vedrai un menu
2. **Seleziona "Redeploy"** dal menu
3. **Si aprirà un popup/panel** con opzioni
4. **Deseleziona "Use existing Build Cache"** o **"Use existing build"**
   - ⚠️ **QUESTO È IMPORTANTE!** Serve per includere la nuova variabile
5. **Clicca "Redeploy"** o **"Confirm"**

### 4.4 Aspetta il Deploy

1. **Il deployment partirà** (di solito 1-3 minuti)
2. **Monitora il progresso** nella pagina Deployments
3. **Quando vedi "Ready"** o un check verde ✅, è finito!

---

## 📍 PASSO 5: Verifica che Funzioni

### 5.1 Apri l'App Deployata

1. **Torna alla dashboard del progetto Vercel**
2. **Trova l'URL del progetto** (in alto, tipo: `https://tuo-progetto.vercel.app`)
3. **Clicca sull'URL** o copialo e aprilo in un nuovo tab

### 5.2 Controlla la Console del Browser

1. **Apri la Console del Browser**:
   - **Chrome/Edge**: Premi `F12` → Tab "Console"
   - **Safari**: `Cmd + Option + I` → Tab "Console"
   - **Firefox**: `F12` → Tab "Console"

2. **Ricarica la pagina** (F5 o Cmd+R)

3. **Dovresti vedere**:
   ```
   🔗 API Base URL configurato: https://tuo-url-railway.up.railway.app/api
   🔍 REACT_APP_API_URL env: https://tuo-url-railway.up.railway.app/api
   ```

**Se vedi questo, la variabile è configurata correttamente! ✅**

### 5.3 Testa il Login

1. **Prova a fare login** nell'app
2. **Se funziona**, tutto è OK! ✅

### 5.4 Testa da Mobile

1. **Apri l'app dal browser mobile**
2. **Prova a fare login**
3. **Se funziona**, anche il problema mobile è risolto! ✅

---

## ✅ Checklist Completa

Prima di considerare tutto fatto, verifica:

- [ ] Ho trovato l'URL del backend Railway
- [ ] Ho testato `/api/health` e funziona
- [ ] Ho aggiunto `REACT_APP_API_URL` su Vercel
- [ ] Il Value è: `https://TUO-URL.up.railway.app/api` (con `/api`!)
- [ ] Ho selezionato Production e Preview
- [ ] Ho salvato la variabile
- [ ] Ho fatto il redeploy su Vercel
- [ ] Ho deselezionato "Use existing Build Cache" durante il redeploy
- [ ] Il deploy è completato
- [ ] La console mostra l'URL API corretto
- [ ] Il login funziona da PC
- [ ] Il login funziona da mobile

---

## 🆘 Problemi Comuni

### "Non trovo l'URL su Railway"
- **Soluzione**: Vai su Settings → Networking → Generate Domain

### "L'URL non funziona quando lo testo"
- **Problema**: Il backend potrebbe non essere deployato correttamente
- **Soluzione**: Controlla i log su Railway per errori

### "Non vedo REACT_APP_API_URL nella console"
- **Problema**: Il redeploy non ha incluso la variabile
- **Soluzione**: 
  - Verifica che la variabile esista su Vercel
  - Fai un nuovo redeploy SENZA cache

### "L'app ancora non funziona da mobile"
- **Problema**: Potrebbe essere un problema di CORS
- **Soluzione**: Verifica che il backend su Railway abbia CORS configurato correttamente (già fatto nel codice)

---

## 🎯 Riepilogo Formula

```
REACT_APP_API_URL = https://[URL-RAILWAY].up.railway.app/api
```

**Esempio:**
```
REACT_APP_API_URL = https://planner-backend-production.up.railway.app/api
```

---

**Dopo aver completato tutti questi passi, l'app dovrebbe funzionare perfettamente anche da mobile! 🚀**

Se hai bisogno di aiuto in un passo specifico, dimmi dove sei bloccato e ti aiuto! 💪

