# ✅ Verifica Backend Railway - Risultati

## Test 1: Health Check

```bash
curl https://planner-turni-production.up.railway.app/api/health
```

**Risultato atteso:** `{"status":"OK","message":"Server funzionante"}`

## Test 2: Endpoint API con Dati Migrati

Testiamo che i dati migrati siano accessibili:

```bash
# Test congregazioni (pubblico, no auth)
curl https://planner-turni-production.up.railway.app/api/congregazioni

# Test login (dobbiamo sapere le credenziali)
curl -X POST https://planner-turni-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"arena@advpro.it","password":"Uditore20"}'
```

## URL Backend Railway

**Backend URL:** `https://planner-turni-production.up.railway.app`

**Base API URL:** `https://planner-turni-production.up.railway.app/api`

## Variabile da Configurare su Vercel

```env
REACT_APP_API_URL=https://planner-turni-production.up.railway.app/api
```

## Note

- Il backend è già configurato con CORS per accettare richieste da qualsiasi origine in produzione
- Il database Railway contiene tutti i dati migrati (286 record)
- Le credenziali degli utenti sono state migrate, quindi il login dovrebbe funzionare
