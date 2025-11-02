# ⚡ Setup Vercel - 3 Passi Veloci

## 🎯 Cosa Devi Fare

Devi configurare **UNA SOLA VARIABILE** su Vercel per far funzionare l'app da mobile.

---

## 📍 PASSO 1: Trova l'URL di Railway

1. **Vai su Railway**: https://railway.app
2. **Clicca sul tuo servizio** (backend)
3. **Cerca l'URL pubblico**:
   - Dovrebbe essere in alto nella card del servizio
   - Oppure vai su **Settings** → **Networking** → **Domain**
   - Tipo: `https://tuo-progetto.up.railway.app`
4. **COPIA QUESTO URL** (es: `https://planner-backend-production.up.railway.app`)
   - ⚠️ **NON copiare** `/api` per ora, solo l'URL base

---

## 📍 PASSO 2: Configura Vercel

1. **Vai su Vercel**: https://vercel.com/dashboard
2. **Clicca sul tuo progetto** (frontend)
3. **Vai su "Settings"** (dalla barra in alto)
4. **Clicca su "Environment Variables"** (nel menu a sinistra)
5. **Clicca "Add New"** o **"Add Variable"**
6. **Compila il form**:
   ```
   Name:  REACT_APP_API_URL
   Value: https://TUO-URL-RAILWAY.up.railway.app/api
   ```
   - ⚠️ **SOSTITUISCI** `TUO-URL-RAILWAY.up.railway.app` con l'URL reale che hai copiato
   - ⚠️ **AGGIUNGI** `/api` alla fine!
   - Esempio: `https://planner-backend-production.up.railway.app/api`

7. **Seleziona gli ambienti**:
   - ✅ Production
   - ✅ Preview
   - ✅ Development (opzionale)

8. **Clicca "Save"**

---

## 📍 PASSO 3: Redeploy Frontend

1. **Restando su Vercel**, vai su **"Deployments"** (dalla barra in alto)
2. **Trova l'ultimo deployment** (il più recente, in alto)
3. **Clicca sui tre puntini (⋯)** a destra del deployment
4. **Seleziona "Redeploy"**
5. **Nel popup**, deseleziona **"Use existing Build Cache"**
   - Questo è **IMPORTANTE** per includere la nuova variabile!
6. **Clicca "Redeploy"**
7. **Aspetta** 1-2 minuti che finisca

---

## ✅ Verifica che Funzioni

1. **Apri l'app deployata** su Vercel (l'URL del frontend)
2. **Apri la Console del Browser** (F12 → Console)
3. **Dovresti vedere**:
   ```
   🔗 API Base URL configurato: https://tuo-url-railway.up.railway.app/api
   ```
4. **Prova a fare login**:
   - Se funziona → ✅ Tutto OK!
   - Se non funziona → Controlla gli errori nella console

---

## 🔍 Esempio Completo

**Railway URL**: `https://planner-backend-production.up.railway.app`

**Vercel Variable**:
```
Name:  REACT_APP_API_URL
Value: https://planner-backend-production.up.railway.app/api
```

---

## ❌ Errori Comuni

### "Non trovo Environment Variables su Vercel"
- Vai su **Settings** → cerca nel menu a sinistra
- Potrebbe chiamarsi anche **"Variables"**

### "La variabile non funziona dopo il redeploy"
- Verifica che hai deselezionato **"Use existing Build Cache"**
- Verifica che l'URL finisca con `/api`

### "L'app non funziona da mobile"
- Verifica nella console che `REACT_APP_API_URL` sia configurato
- Verifica che l'URL di Railway sia corretto e accessibile

---

## 📝 Checklist

- [ ] Ho trovato l'URL di Railway
- [ ] Ho aggiunto `REACT_APP_API_URL` su Vercel con l'URL Railway + `/api`
- [ ] Ho selezionato tutti gli ambienti (Production, Preview)
- [ ] Ho fatto il redeploy su Vercel
- [ ] Ho deselezionato "Use existing Build Cache" durante il redeploy
- [ ] L'app funziona da PC
- [ ] L'app funziona da mobile

---

**Dopo questi 3 passi, l'app dovrebbe funzionare anche da mobile! 🚀**

