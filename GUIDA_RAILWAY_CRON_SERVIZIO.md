# 🚂 Guida: Creare Servizio Cron su Railway

## Opzione 1: Nuovo Servizio Railway (Cron Job Dedicato)

Se preferisci un servizio separato su Railway per il cron job, segui questi passaggi:

### Passo 1: Crea Nuovo Servizio

1. Vai su **Railway Dashboard** → Il tuo progetto
2. Clicca su **"+ New"** → **"Empty Service"** (o **"Empty"**)
3. Dai un nome: `cleanup-disponibilita-cron`

### Passo 2: Collega Repository

1. Nel nuovo servizio, vai su **Settings** → **Source**
2. Collega lo stesso repository GitHub del backend
3. Imposta **Root Directory**: `server`

### Passo 3: Configurazione Build

1. Vai su **Settings** → **Build & Deploy**
2. **Build Command**: `npm install`
3. **Start Command**: `node scripts/cleanup-disponibilita.js --before-current-month`

### Passo 4: Variabili Ambiente

1. Vai su **Variables**
2. Copia tutte le variabili dal servizio backend principale:
   - `DATABASE_URL` (importante!)
   - `NODE_ENV=production`
   - Eventuali altre necessarie

### Passo 5: Configura Cron Schedule

1. Vai su **Settings** → **Cron Schedule** (o **Deploy**)
2. Se disponibile, imposta:
   - **Cron Expression**: `0 0 1 * *` (primo del mese alle 00:00)
   - **Cron Command**: `node scripts/cleanup-disponibilita.js --before-current-month`

**Nota**: Railway potrebbe richiedere un `railway.json` o configurazione specifica. Se non trovi "Cron Schedule", usa l'**Opzione 2** (endpoint API + servizio esterno).

---

## Opzione 2: Endpoint API + Servizio Esterno (PIÙ SEMPLICE)

### Passo 1: Usa l'Endpoint API Creato

L'endpoint è già disponibile nel backend:
- **URL**: `POST https://tuo-backend.railway.app/api/admin/cleanup-disponibilita`
- **Query params**:
  - `beforeCurrentMonth=true` (consigliato)
  - oppure `days=90` (per giorni personalizzati)
- **Headers**: `Authorization: Bearer <token_admin>`

### Passo 2: Ottieni Token Admin

```bash
# Fai login come admin o super_admin
curl -X POST https://tuo-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}'
```

Copia il `token` dalla risposta.

### Passo 3: Usa Servizio Esterno

#### Opzione A: cron-job.org (GRATUITO)

1. Vai su https://cron-job.org
2. Crea account gratuito
3. Crea nuovo cron job:
   - **URL**: `POST https://tuo-backend.railway.app/api/admin/cleanup-disponibilita?beforeCurrentMonth=true`
   - **Method**: `POST`
   - **Headers**: `Authorization: Bearer <token>`
   - **Schedule**: `0 0 1 * *` (primo del mese)
4. Salva

#### Opzione B: GitHub Actions (GRATIS)

Crea `.github/workflows/cleanup.yml`:

```yaml
name: Cleanup Disponibilità

on:
  schedule:
    - cron: '0 0 1 * *'  # Primo giorno del mese

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Esegui cleanup
        run: |
          curl -X POST "${{ secrets.BACKEND_URL }}/api/admin/cleanup-disponibilita?beforeCurrentMonth=true" \
            -H "Authorization: Bearer ${{ secrets.ADMIN_TOKEN }}"
```

Aggiungi secrets su GitHub:
- `BACKEND_URL`: URL del backend Railway
- `ADMIN_TOKEN`: Token JWT dell'admin

---

## Opzione 3: Nuovo Servizio Railway con Script Periodico

Se Railway supporta cron nativi:

### Configurazione Servizio

1. Crea **Empty Service** su Railway
2. Root Directory: `server`
3. Start Command: lasciato vuoto (non deve rimanere in esecuzione)
4. Aggiungi `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node scripts/cleanup-disponibilita.js --before-current-month",
    "restartPolicyType": "NEVER"
  }
}
```

### Cron Configuration (se disponibile)

Nel dashboard Railway, se c'è una sezione **"Cron"**:
- **Schedule**: `0 0 1 * *`
- **Command**: `node scripts/cleanup-disponibilita.js --before-current-month`

---

## Raccomandazione

**Usa l'Opzione 2 (Endpoint API + cron-job.org)** perché:
- ✅ Non richiede nuovo servizio Railway
- ✅ Più facile da configurare
- ✅ Gratuito
- ✅ Più controllo e logging
- ✅ Puoi eseguirlo manualmente quando vuoi

Se preferisci tutto su Railway, prova l'**Opzione 1** o **Opzione 3**.

---

## Test Manuale Endpoint

```bash
# Test locale
curl -X POST http://localhost:5001/api/admin/cleanup-disponibilita?beforeCurrentMonth=true \
  -H "Authorization: Bearer <tuo_token_admin>"

# Test produzione
curl -X POST https://tuo-backend.railway.app/api/admin/cleanup-disponibilita?beforeCurrentMonth=true \
  -H "Authorization: Bearer <tuo_token_admin>"
```

Risposta attesa:
```json
{
  "success": true,
  "message": "Cleanup completato: 42 record eliminati.",
  "deletedCount": 42,
  "cutoffDate": "2025-11-01",
  "mode": "before-current-month"
}
```
