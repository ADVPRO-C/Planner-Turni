# 📋 Passo-Passo: Creare Servizio Cron su Railway

## ✅ Soluzione più semplice: Endpoint API (NON richiede nuovo servizio)

**Ti consiglio di usare questa opzione!** Ho creato un endpoint API nel backend esistente.

### Come funziona:
1. **Endpoint già creato**: `POST /api/admin/cleanup-disponibilita`
2. Usa un servizio esterno GRATUITO come **cron-job.org** per chiamarlo periodicamente
3. Non serve nuovo servizio Railway

**Vai direttamente a**: [GUIDA_RAILWAY_CRON_SERVIZIO.md](./GUIDA_RAILWAY_CRON_SERVIZIO.md) → **Opzione 2**

---

## 🚂 Soluzione alternativa: Nuovo Servizio Railway

Se preferisci tutto su Railway, crea un nuovo servizio:

### Passo 1: Crea Servizio Vuoto
1. Vai su **Railway Dashboard**
2. Seleziona il tuo progetto
3. Clicca **"+ New"** → **"Empty Service"**
4. Nome: `cleanup-disponibilita-cron`

### Passo 2: Collega Repository
1. Nel nuovo servizio → **Settings** → **Source**
2. Seleziona lo stesso repository GitHub del backend
3. **Root Directory**: `server`

### Passo 3: Variabili Ambiente
1. Vai su **Variables**
2. Clicca **"Add Variable"**
3. Aggiungi tutte le variabili del backend principale:
   - `DATABASE_URL` (copiala dal servizio backend)
   - `NODE_ENV=production`
   - Eventuali altre necessarie

**Come copiare variabili:**
- Vai al servizio backend → **Variables**
- Copia manualmente ogni variabile, oppure
- Se Railway supporta "Link Variable", linka `DATABASE_URL` direttamente

### Passo 4: Configurazione Build
1. Vai su **Settings** → **Build & Deploy**
2. **Build Command**: `npm install` (se non già presente)
3. **Start Command**: `node scripts/cleanup-disponibilita.js --before-current-month`

### Passo 5: Configurazione Cron (se disponibile)

Railway potrebbe avere una sezione **"Cron"** o **"Scheduled Tasks"**:

1. Cerca in **Settings** → **Cron** o **Jobs**
2. Se disponibile:
   - **Schedule**: `0 0 1 * *` (primo del mese alle 00:00)
   - **Command**: `node scripts/cleanup-disponibilita.js --before-current-month`

**Nota**: Se Railway non ha supporto cron nativo, il servizio eseguirà lo script una volta all'avvio e poi si fermerà. In questo caso:
- Dovrai eseguirlo manualmente dal dashboard Railway
- Oppure usa l'**Opzione 1 (Endpoint API)** che è più pratica

### Passo 6: Test

1. **Deploy manuale**:
   - Vai su **Deployments**
   - Clicca **"Redeploy"** o **"Manual Deploy"**
2. Controlla i **Logs** per vedere l'output dello script
3. Verifica che i record vengano eliminati correttamente

---

## 🔄 Alternativa: Usa GitHub Actions (GRATIS)

Se Railway non supporta cron nativi, usa GitHub Actions:

1. Crea `.github/workflows/cleanup.yml` nel repository
2. Aggiungi i secrets su GitHub:
   - `DATABASE_URL`
   - `RAILWAY_API_TOKEN` (opzionale, per trigger Railway)
3. Lo script verrà eseguito automaticamente ogni mese

**Vedi**: [GUIDA_RAILWAY_CRON_SERVIZIO.md](./GUIDA_RAILWAY_CRON_SERVIZIO.md) per esempio completo.

---

## ❓ Quale scegliere?

| Opzione | Vantaggi | Svantaggi |
|---------|----------|-----------|
| **Endpoint API + cron-job.org** | ✅ Più semplice<br>✅ Gratuito<br>✅ Controllo totale<br>✅ Eseguibile manualmente | ❌ Richiede servizio esterno |
| **Nuovo Servizio Railway** | ✅ Tutto su Railway<br>✅ Stesse credenziali | ❌ Può costare di più<br>❌ Meno flessibile |
| **GitHub Actions** | ✅ Gratuito<br>✅ Integrato con repo | ❌ Richiede configurazione YAML |

**Raccomandazione**: Usa **Endpoint API + cron-job.org** per semplicità e controllo.

---

## 🆘 Problemi comuni

**"Il servizio si ferma subito dopo l'avvio"**
- ✅ Normale! Lo script esegue e termina.
- Railway potrebbe non supportare cron nativi, usa l'endpoint API invece.

**"Non trovo la sezione Cron su Railway"**
- Railway potrebbe non avere cron nativi ancora.
- Usa l'**Opzione 1 (Endpoint API)**.

**"Errore DATABASE_URL non trovata"**
- Verifica che le variabili siano copiate correttamente nel nuovo servizio.
- Assicurati che `DATABASE_URL` sia una **Service Variable** (non Shared, se il DB è in un altro servizio).
