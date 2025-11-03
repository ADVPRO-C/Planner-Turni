# 🚀 Ultimo Passo: Configurazione Variabile Ambiente su Vercel

## ✅ Codice Deployato

Il codice è stato pushato su GitHub. Se Vercel è collegato al repository, il deploy dovrebbe partire automaticamente.

## ⚠️ IMPORTANTE: Configura Variabile Ambiente

**Prima che l'app funzioni in produzione, DEVI configurare questa variabile su Vercel:**

### Passo 1: Vai su Vercel Dashboard
1. Apri https://vercel.com/dashboard
2. Seleziona il tuo progetto "planner-turni" (o il nome del progetto)

### Passo 2: Aggiungi Variabile Ambiente
1. Clicca su **Settings** (in alto)
2. Clicca su **Environment Variables** (menu laterale)
3. Clicca su **Add New**
4. Inserisci:
   - **Key:** `REACT_APP_API_URL`
   - **Value:** `https://planner-turni-production.up.railway.app/api`
   - **Environment:** Seleziona tutte e tre:
     - ☑️ Production
     - ☑️ Preview  
     - ☑️ Development
5. Clicca **Save**

### Passo 3: Redeploy
1. Vai alla sezione **Deployments**
2. Trova l'ultimo deployment
3. Clicca sui tre puntini `...` → **Redeploy**
4. Clicca **Redeploy** (puoi lasciare "Use existing Build Cache")

## ✅ Verifica

Dopo il redeploy:

1. Apri l'app su Vercel (il tuo dominio pubblico)
2. Apri la console del browser (F12 → Console)
3. Dovresti vedere:
   ```
   🔗 API Base URL configurato: https://planner-turni-production.up.railway.app/api
   ```
4. Se vedi questo, la configurazione è corretta! ✅

## 🧪 Test Login

Prova a fare login con:
- **Email:** `arena@advpro.it`
- **Password:** `Uditore20`
- **Codice Congregazione:** `001`

Se il login funziona, tutto è configurato correttamente! 🎉

## 📞 Supporto

Se qualcosa non funziona:
1. Verifica i logs del deployment su Vercel
2. Verifica la console del browser per errori
3. Verifica che la variabile ambiente sia presente nel deployment

