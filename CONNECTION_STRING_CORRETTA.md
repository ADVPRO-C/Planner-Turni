# ✅ Connection String Supabase Corretta

## Connection String Completa

```
postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres
```

## Connection String con Pooler (IPv4)

Se il pooler è abilitato:
```
postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:6543/postgres?pgbouncer=true&sslmode=require
```

---

## ✅ Verifica su Railway

Assicurati che `SUPABASE_DATABASE_URL` su Railway contenga:

**Per porta diretta (5432):**
```
postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres
```

**Per pooler (6543) - consigliato:**
```
postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:6543/postgres?pgbouncer=true&sslmode=require
```

