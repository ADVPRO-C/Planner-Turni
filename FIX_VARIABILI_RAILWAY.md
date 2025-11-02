# 🔧 Fix Variabili Railway - DATABASE_URL Non Funziona

## ❌ Problema
Le variabili sono configurate ma il server non le legge - prova ancora localhost:5432.

## 🔍 Possibili Cause

### 1. Variabili "Shared" invece di "Service"
Le variabili potrebbero essere "Shared Variables" invece di "Service Variables".

**Soluzione**:
- Le variabili devono essere configurate come **"Service Variables"** (nella vista del servizio specifico)
- NON "Shared Variables" (quelle del progetto)

### 2. Variabili Configurate in Ambiente Sbagliato
Le variabili potrebbero essere configurate per un ambiente diverso (es: Development invece di Production).

**Soluzione**:
- Verifica che le variabili siano selezionate per **Production** (o tutti gli ambienti)

### 3. Redeploy Necessario
Dopo aver aggiunto le variabili, potrebbe essere necessario un redeploy esplicito.

## ✅ Soluzione Passo-Passo

### Step 1: Verifica Tipo di Variabili

1. **Vai su Railway** → Il tuo progetto → Il tuo servizio
2. **Vai su "Variables"**
3. **Guarda la sezione superiore** - dovrebbe dire **"Service Variables"** o **"Variables"**
4. **NON** usare "Shared Variables" (quella è per il progetto intero)

### Step 2: Verifica che le Variabili Siano Presenti

Dovresti vedere nella lista:
- ✅ `DATABASE_URL`
- ✅ `JWT_SECRET`
- ✅ `NODE_ENV`

### Step 3: Verifica Ambiente

1. **Clicca su ogni variabile** (o sui 3 puntini)
2. **Verifica che sia selezionata** per l'ambiente corretto:
   - ✅ **Production** (almeno questo)
   - ✅ Preview (opzionale)
   - ✅ Development (opzionale)

### Step 4: Elimina e Ricrea (Se Necessario)

Se le variabili sono già configurate ma non funzionano:

1. **Elimina** tutte e 3 le variabili (`DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`)
2. **Ricreale** da zero
3. **Assicurati** che siano **Service Variables** (nella vista del servizio)
4. **Seleziona** tutti gli ambienti

### Step 5: Redeploy Esplicito

1. **Vai su "Deployments"**
2. **Clicca sui 3 puntini** dell'ultimo deployment
3. **Seleziona "Redeploy"**
4. **Attendi** che finisca (1-2 minuti)

### Step 6: Controlla i Log

Nei log dovresti vedere:
```
✅ DATABASE_URL trovata, usando connection string
Connessione al database riuscita
```

**NON dovresti vedere**:
```
⚠️ DATABASE_URL non trovata
Errore: ECONNREFUSED 127.0.0.1:5432
```

## 🔍 Debug: Verifica che le Variabili Siano Accessibili

Aggiungi questo codice temporaneo in `server/index.js` per verificare:

```javascript
console.log("🔍 DEBUG VARIABILI:", {
  DATABASE_URL: process.env.DATABASE_URL ? "PRESENTE" : "ASSENTE",
  JWT_SECRET: process.env.JWT_SECRET ? "PRESENTE" : "ASSENTE",
  NODE_ENV: process.env.NODE_ENV || "NON SETTATO"
});
```

Ma prima, proviamo a risolvere con le soluzioni sopra.

## 📋 Checklist

- [ ] Variabili sono "Service Variables" (nella vista del servizio)
- [ ] Variabili sono selezionate per Production
- [ ] DATABASE_URL contiene la connection string completa di Supabase
- [ ] JWT_SECRET è configurato
- [ ] NODE_ENV = production
- [ ] Redeploy eseguito dopo aver configurato le variabili
- [ ] Log mostrano "✅ DATABASE_URL trovata"

## ⚠️ Nota Importante

Se stai usando **"Shared Variables"** (condivise tra servizi), Railway potrebbe non passarle correttamente. Usa sempre **"Service Variables"** per variabili specifiche di un servizio.

