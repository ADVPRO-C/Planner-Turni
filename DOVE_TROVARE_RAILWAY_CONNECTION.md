# 🔍 Dove Trovare la Connection String Completa di Railway

## 📍 Informazioni che mi hai fornito

✅ **Host**: `ballast.proxy.rlwy.net`
✅ **Porta pubblica**: `30883`
✅ **Porta database**: `5432`

Ma mi serve la **connection string completa** che include username, password e database name.

---

## 🎯 Come Trovare la Connection String Completa

### Step 1: Vai su Railway Dashboard

1. Vai su https://railway.app
2. Seleziona il progetto "Planner-Turni"
3. **Clicca sul database PostgreSQL** che hai creato

### Step 2: Vai su Settings → Connect

1. Dalla sidebar, clicca su **"Settings"**
2. Cerca la sezione **"Connect"** o **"Connection"**
3. Dovresti vedere **"Connection Variables"** o **"DATABASE_URL"**

### Step 3: Copia la Connection String

Dovresti vedere qualcosa tipo:

```
postgresql://postgres:PASSWORD@ballast.proxy.rlwy.net:5432/railway
```

Oppure variabili separate:
- `PGHOST=ballast.proxy.rlwy.net`
- `PGPORT=5432`
- `PGUSER=postgres`
- `PGPASSWORD=[password]`
- `PGDATABASE=railway`

### Step 4: Copia tutto e incollalo qui

**Cerca la stringa completa che inizia con `postgresql://`** - quella è quella che mi serve!

---

## 🔐 Se vedi solo variabili separate

Se vedi solo le variabili separate (PGHOST, PGPORT, etc.), posso costruire la connection string così:

```
postgresql://postgres:[PASSWORD]@ballast.proxy.rlwy.net:5432/railway
```

Ma mi serve la **password** che Railway ha generato automaticamente.

---

## ⚡ Formato Atteso

La connection string completa dovrebbe essere tipo:

```
postgresql://postgres:abc123xyz789@ballast.proxy.rlwy.net:5432/railway
```

Oppure se usa la porta pubblica:

```
postgresql://postgres:abc123xyz789@ballast.proxy.rlwy.net:30883/railway
```

**⚠️ IMPORTANTE**: Copia l'intera stringa, inclusa la password!

---

**Vai su Settings → Connect e copia la connection string completa (DATABASE_URL) che include tutto!** 🎯

