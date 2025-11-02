# 🔍 Verifica Connection String Supabase

## ❌ Problema

Il DNS non riesce a risolvere `db.wwcgryzbgvxfviwcjnkg.supabase.co`.

---

## ✅ Cosa Fare

### Step 1: Vai su Supabase Dashboard

1. Apri: https://supabase.com/dashboard
2. **Accedi** al tuo account
3. **Seleziona il progetto**

### Step 2: Verifica Connection String

1. **Settings** → **Database**
2. Cerca la sezione **"Connection string"**
3. **Copia la connection string URI** (non il template!)

**⚠️ IMPORTANTE**: Non copiare quella con `[YOUR_PASSWORD]`, ma quella che mostra la password reale (anche se mascherata).

### Step 3: Verifica Nome Host

Il nome host dovrebbe essere tipo:
- `db.xxxxx.supabase.co` (dove xxxxx è il tuo project ref)

**Il nome host che hai dato (`db.wwcgryzbgvxfviwcjnkg.supabase.co`) potrebbe essere errato o il progetto potrebbe essere stato disattivato.**

---

## 🔍 Alternative

Se il progetto è disattivato:
- **Riattivalo** su Supabase
- Oppure **copia i dati manualmente** se sono pochi

Se il nome host è cambiato:
- **Copia la nuova connection string** da Supabase Dashboard
- **Aggiorna** le variabili ambiente

---

**Vai su Supabase Dashboard e dimmi:**
1. Il progetto è **attivo**?
2. Qual è la **connection string completa** che vedi? (anche se la password è mascherata, il nome host dovrebbe essere visibile)

**Con queste info risolviamo il problema!** 🔍

