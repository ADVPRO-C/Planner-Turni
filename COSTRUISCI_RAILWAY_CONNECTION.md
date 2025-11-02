# 🔧 Come Costruire la Connection String Railway

## ✅ Informazioni che hai

- **Host**: `ballast.proxy.rlwy.net`
- **Porta pubblica**: `30883`
- **Porta database**: `5432` (interno)

## 🔑 Cosa manca

Mi serve anche:
- **Username** (solitamente `postgres`)
- **Password** (generata automaticamente da Railway - questa è la parte importante!)
- **Database name** (solitamente `railway` o `postgres`)

---

## 🎯 Dove Trovare Username e Password

### Metodo 1: Settings → Variables (Consigliato)

1. Railway Dashboard → Database PostgreSQL
2. **Settings** → **Variables**
3. Cerca queste variabili:
   - `PGUSER` o `POSTGRES_USER` → Username
   - `PGPASSWORD` o `POSTGRES_PASSWORD` → Password ⚠️ (questa è quella che mi serve!)
   - `PGDATABASE` o `POSTGRES_DB` → Database name

### Metodo 2: Settings → Connect

1. Railway Dashboard → Database PostgreSQL
2. **Settings** → **Connect**
3. Dovresti vedere:
   - Una connection string completa tipo `postgresql://postgres:password@...`
   - Oppure variabili separate con i valori

### Metodo 3: Service Variables

1. Railway Dashboard → Database PostgreSQL
2. Dalla sidebar, cerca **"Variables"**
3. Dovresti vedere tutte le variabili ambiente del database

---

## 📝 Formato Connection String

La connection string completa sarà tipo:

```
postgresql://[USERNAME]:[PASSWORD]@ballast.proxy.rlwy.net:5432/[DATABASE]
```

Esempio:
```
postgresql://postgres:abc123xyz@ballast.proxy.rlwy.net:5432/railway
```

---

## ⚡ Alternativa: Usa la Porta Pubblica

Se Railway richiede la porta pubblica invece di quella interna, usa:

```
postgresql://[USERNAME]:[PASSWORD]@ballast.proxy.rlwy.net:30883/[DATABASE]
```

---

## 🎯 Cosa Fornirmi

Per favore, vai su **Settings → Variables** del database Railway e dimmi:

1. Il valore di `PGPASSWORD` (o `POSTGRES_PASSWORD`)
2. Il valore di `PGUSER` (o `POSTGRES_USER`) - se diverso da `postgres`
3. Il valore di `PGDATABASE` (o `POSTGRES_DB`) - se diverso da `railway`

Oppure, se vedi una connection string completa che inizia con `postgresql://`, copia quella direttamente!

---

**La password è la parte più importante - dimmi quella e costruisco io la connection string!** 🔐

