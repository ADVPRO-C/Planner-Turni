# 🚀 Attivazione Cleanup Automatico - Guida Pratica

## ✅ Stato Attuale

L'endpoint API è **già stato creato** e sarà **operativo dopo il deploy** del backend su Railway.

Endpoint disponibile: `POST https://tuo-backend.railway.app/api/admin/cleanup-disponibilita`

---

## 📋 Passi da Seguire (5 minuti)

### Passo 1: Verifica che il Backend sia Deployato

1. Vai su **Railway Dashboard** → Il tuo progetto → Servizio backend
2. Verifica che l'ultimo deploy sia completato con successo
3. Controlla che il backend risponda: `https://tuo-backend.railway.app/api/health`

Se vedi `{"status": "OK", "message": "Server funzionante"}` → ✅ Backend operativo!

---

### Passo 2: Ottieni Token Admin

Hai bisogno del token JWT di un utente con ruolo `admin` o `super_admin`.

#### Opzione A: Dal Frontend (più semplice)
1. Fai login nell'app con un account admin/super_admin
2. Apri la **Console del Browser** (F12)
3. Vai su **Application** → **Local Storage** (o **Session Storage**)
4. Cerca `token` o `authToken`
5. Copia il valore del token

#### Opzione B: Via API (se non hai accesso frontend)

```bash
curl -X POST https://tuo-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tuo-email-admin@example.com",
    "password": "tua-password"
  }'
```

Dalla risposta, copia il valore di `token`.

**Esempio risposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

---

### Passo 3: Test Manuale dell'Endpoint

Prima di schedulare, testa manualmente che funzioni:

```bash
curl -X POST "https://tuo-backend.railway.app/api/admin/cleanup-disponibilita?beforeCurrentMonth=true" \
  -H "Authorization: Bearer TUO_TOKEN_QUI" \
  -H "Content-Type: application/json"
```

**Risposta attesa:**
```json
{
  "success": true,
  "message": "Cleanup completato: 42 record eliminati.",
  "deletedCount": 42,
  "cutoffDate": "2025-11-01",
  "mode": "before-current-month"
}
```

Se funziona → ✅ Endpoint operativo!

---

### Passo 4: Configura Cron Job su cron-job.org

1. **Registrati** su https://cron-job.org (account gratuito)

2. **Crea nuovo cron job**:
   - Clicca **"Create cronjob"** o **"Add cronjob"**
   - Nome: `Cleanup Disponibilità Planner`
   - URL: `https://tuo-backend.railway.app/api/admin/cleanup-disponibilita?beforeCurrentMonth=true`
   - **Method**: `POST`
   - **Schedule**: `0 0 1 * *` (primo giorno del mese alle 00:00 UTC)
   - **Request Settings** → **Headers**:
     - Name: `Authorization`
     - Value: `Bearer TUO_TOKEN_QUI`

3. **Salva** il cron job

4. **Test immediato**:
   - Clicca su **"Execute now"** per testare subito
   - Verifica i log che l'esecuzione sia riuscita

---

### Passo 5: (Opzionale) Configura Notifiche

Su cron-job.org puoi configurare:
- **Email notifications** per successi/errori
- **Webhook** per inviare notifiche altrove

---

## 🔍 Verifica Funzionamento

### Verifica Logs su Railway
1. Vai su Railway → Servizio backend → **Logs**
2. Dopo l'esecuzione del cron job, dovresti vedere:
   - Richiesta POST a `/api/admin/cleanup-disponibilita`
   - Messaggi di cleanup se ci sono record da eliminare

### Verifica Logs su cron-job.org
1. Vai su **"Execution History"** del tuo cron job
2. Controlla che le esecuzioni siano **successful** (status 200)
3. Puoi vedere la risposta completa con `deletedCount`

### Verifica Database
```sql
-- Conta disponibilità prima e dopo
SELECT COUNT(*) FROM disponibilita;

-- Verifica che non ci siano disponibilità troppo vecchie
SELECT COUNT(*) FROM disponibilita WHERE data < DATE_TRUNC('month', CURRENT_DATE);
```

---

## ⚠️ Note Importanti

### Sicurezza del Token

Il token JWT scade dopo un certo periodo (configurato nel backend). Se il cron job inizia a fallire con errori 401/403:
1. Genera un nuovo token (fai login di nuovo)
2. Aggiorna il token nel cron job su cron-job.org

**Soluzione alternativa**: Se hai accesso al codice backend, puoi creare un **token permanente** solo per questo scopo (non consigliato per produzione, ma funziona).

### Fuso Orario

Il cron job su cron-job.org usa **UTC** (Coordinated Universal Time).

- `0 0 1 * *` = Primo del mese alle 00:00 UTC
- Se vuoi che esegua a un'ora specifica del tuo fuso orario, calcola l'offset:
  - Italia (UTC+1): `0 1 1 * *` = Primo del mese alle 01:00 UTC = 02:00 ora italiana
  - Per ora esatta italiana: `0 23 1 * *` = Primo del mese alle 23:00 UTC = 00:00 ora italiana del giorno successivo (effettivamente il primo del mese)

### Gestione Errori

Se il cron job fallisce:
- Controlla i log su cron-job.org per vedere l'errore
- Verifica che il token sia ancora valido
- Verifica che il backend sia online
- Controlla che `DATABASE_URL` sia configurata correttamente

---

## 🎯 Riepilogo Comandi Utili

### Test Manuale Locale (se backend in locale)
```bash
curl -X POST "http://localhost:5001/api/admin/cleanup-disponibilita?beforeCurrentMonth=true" \
  -H "Authorization: Bearer TUO_TOKEN" \
  -H "Content-Type: application/json"
```

### Test Manuale Produzione
```bash
curl -X POST "https://tuo-backend.railway.app/api/admin/cleanup-disponibilita?beforeCurrentMonth=true" \
  -H "Authorization: Bearer TUO_TOKEN" \
  -H "Content-Type: application/json"
```

### Con giorni personalizzati
```bash
curl -X POST "https://tuo-backend.railway.app/api/admin/cleanup-disponibilita?days=90" \
  -H "Authorization: Bearer TUO_TOKEN" \
  -H "Content-Type: application/json"
```

---

## ✅ Checklist Finale

- [ ] Backend deployato e risponde a `/api/health`
- [ ] Token admin ottenuto
- [ ] Endpoint testato manualmente e funziona
- [ ] Cron job creato su cron-job.org
- [ ] Cron job testato con "Execute now"
- [ ] Verificati i log dopo prima esecuzione
- [ ] Configurate notifiche (opzionale)

**Una volta completati tutti i passi, il cleanup sarà completamente automatico!** 🎉
