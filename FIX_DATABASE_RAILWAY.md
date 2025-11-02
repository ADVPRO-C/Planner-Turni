# 🔧 Fix Errore Database su Railway

## ❌ Problema

```
Errore nella connessione al database: ECONNREFUSED 127.0.0.1:5432
```

Il backend sta cercando di connettersi a `localhost:5432` invece di usare `DATABASE_URL` di Supabase.

## 🔍 Causa

La variabile `DATABASE_URL` **non è configurata** o **non è visibile** al processo Node.js su Railway.

## ✅ Soluzione

### Step 1: Verifica che DATABASE_URL sia Configurata su Railway

1. **Vai su Railway** → Il tuo progetto → Il tuo servizio
2. **Vai su "Variables"** (dalla sidebar)
3. **Verifica** che esista la variabile `DATABASE_URL`
4. **Controlla il valore** - dovrebbe essere:
   ```
   postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres
   ```

### Step 2: Se DATABASE_URL Non Esiste, Aggiungila

1. **In Variables**, clicca **"New Variable"**
2. **Compila**:
   - **Name**: `DATABASE_URL`
   - **Value**: `postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres`
   - **Environment**: Seleziona tutte (Production, Preview, Development)
3. **Clicca "Add"** o **"Save"**

### Step 3: Verifica le Altri Variabili

Assicurati che queste variabili siano presenti:

- ✅ `DATABASE_URL` = `postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres`
- ✅ `JWT_SECRET` = `planner-turni-jwt-secret-2024-super-sicuro-minimo-32-caratteri-lungo`
- ✅ `NODE_ENV` = `production`

### Step 4: Redeploy

1. **Vai su "Deployments"**
2. **Clicca "Redeploy"** sull'ultimo deployment
3. **Aspetta** che finisca (1-2 minuti)

### Step 5: Controlla i Log

Dopo il redeploy, nei log dovresti vedere:

```
✅ DATABASE_URL trovata, usando connection string
Connessione al database riuscita
```

**NON dovresti vedere**:
```
⚠️ DATABASE_URL non trovata
Errore nella connessione al database: ECONNREFUSED
```

## 🔍 Debug: Se Ancora Non Funziona

Se dopo aver configurato `DATABASE_URL` continua a non funzionare:

1. **Controlla i log** - dovresti vedere `✅ DATABASE_URL trovata` (ho aggiunto log di debug)
2. **Verifica il valore** - potrebbe esserci uno spazio o carattere nascosto
3. **Prova a eliminare e ricreare** la variabile `DATABASE_URL`
4. **Assicurati** che sia selezionata per l'ambiente corretto (Production)

## 📋 Checklist

- [ ] `DATABASE_URL` esiste su Railway
- [ ] Il valore è corretto (connection string Supabase completa)
- [ ] `JWT_SECRET` è configurato
- [ ] `NODE_ENV` è configurato come `production`
- [ ] Ho fatto il redeploy dopo aver aggiunto/modificato le variabili
- [ ] I log mostrano `✅ DATABASE_URL trovata`
- [ ] I log mostrano `Connessione al database riuscita`

## 🎯 Nota Importante

La connection string di Supabase **già include** tutte le informazioni necessarie (host, porta, database, user, password), quindi il codice dovrebbe usarla direttamente.

Il problema è che Railway non sta passando la variabile al processo Node.js, quindi verifica che sia configurata correttamente nelle "Variables" del servizio.

