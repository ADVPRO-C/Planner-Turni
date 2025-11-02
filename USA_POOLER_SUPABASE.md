# 🔧 Fix: Usa Pooler Supabase per IPv4

## ❌ Problema

Railway non può connettersi a Supabase perché usa IPv6, e Railway non supporta IPv6 esterni.

## ✅ Soluzione: Usa Connection Pooler di Supabase (IPv4)

Supabase offre un **Connection Pooler** sulla porta **6543** che usa IPv4.

---

## 🎯 STEP: Aggiorna SUPABASE_DATABASE_URL

### Cosa Fare:

1. **Railway** → Servizio Backend → **"Variables"**
2. **Trova** `SUPABASE_DATABASE_URL`
3. **Modifica** il valore

**Da:**
```
postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres
```

**A (usa porta 6543):**
```
postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:6543/postgres?pgbouncer=true&sslmode=require
```

4. **Salva**

---

## 📋 Dettagli

- **Porta 6543**: Connection Pooler (IPv4)
- **Porta 5432**: Direct connection (IPv6)
- **pgbouncer=true**: Abilita pooler
- **sslmode=require**: SSL obbligatorio

---

## ✅ Dopo Aver Aggiornato

**Dimmi "aggiornato" e riprovo la migrazione!**

Il pooler dovrebbe risolvere il problema IPv6.

---

**Aggiorna la variabile con la porta 6543 e dimmi quando è fatto!** 🎯

