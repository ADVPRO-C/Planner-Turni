# 🔍 Verifica Completa Backend Railway

## ✅ Test 1: Health Check
**Endpoint:** `GET /api/health`

**Risultato:** ✅ OK
```json
{"status":"OK","message":"Server funzionante"}
```

**Conclusione:** Il backend è online e risponde correttamente.

---

## ✅ Test 2: Login con Dati Migrati
**Endpoint:** `POST /api/auth/login`

**Credenziali di test:**
- Email: `arena@advpro.it`
- Password: `Uditore20`

**Risultato atteso:** 
- Token JWT se le credenziali sono corrette
- Errore se le credenziali sono sbagliate o l'utente non esiste

**Conclusione:** Verifica che gli utenti siano stati migrati correttamente.

---

## 📋 Prossimi Test

Una volta verificato il login, possiamo testare:

1. **GET /api/congregazioni** (con token)
   - Verifica che le 2 congregazioni siano accessibili

2. **GET /api/volontari** (con token)
   - Verifica che i 35 volontari siano visibili

3. **GET /api/postazioni** (con token)
   - Verifica che le 3 postazioni siano disponibili

---

## 🔗 URL Backend Railway

**Base URL:** `https://planner-turni-production.up.railway.app`

**API Base URL:** `https://planner-turni-production.up.railway.app/api`

---

## ⚙️ Configurazione Vercel

Dopo aver verificato che tutto funziona, configura su Vercel:

**Variabile ambiente:**
```
REACT_APP_API_URL=https://planner-turni-production.up.railway.app/api
```

