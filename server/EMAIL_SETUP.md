# Configurazione Email Assistenza

Il sistema di assistenza è configurato per inviare email a **advprocomunicazione@gmail.com**.

## Configurazione Variabili d'Ambiente

Aggiungi le seguenti variabili nel file `.env` del server:

### Opzione 1: SMTP Generico

```env
# Email destinatario assistenza (default: advprocomunicazione@gmail.com)
ASSISTENZA_EMAIL=advprocomunicazione@gmail.com

# Configurazione SMTP
SMTP_HOST=smtp.tuoserver.com
SMTP_PORT=587
SMTP_USER=tuo-username
SMTP_PASS=tua-password

# Email mittente (opzionale)
EMAIL_FROM="Sistema Planner" <noreply@tuodominio.com>
```

### Opzione 2: Gmail (App Password)

```env
# Email destinatario assistenza
ASSISTENZA_EMAIL=advprocomunicazione@gmail.com

# Configurazione Gmail
GMAIL_USER=tua-email@gmail.com
GMAIL_APP_PASSWORD=tua-app-password

# Email mittente (opzionale, userà GMAIL_USER se non specificato)
EMAIL_FROM="Sistema Planner" <tua-email@gmail.com>
```

**Nota per Gmail**: Devi generare una "App Password" da:
1. Google Account → Sicurezza
2. Verifica in due passaggi (deve essere attiva)
3. Password delle app → Genera nuova password

### Opzione 3: Resend API (Futuro)

Quando implementerai Resend API, sostituisci la funzione `createTransporter()` in `server/routes/assistenza.js` con:

```javascript
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// In inviaEmail, usa:
const { data, error } = await resend.emails.send({
  from: process.env.EMAIL_FROM || 'Sistema Planner <noreply@tuodominio.com>',
  to: EMAIL_DESTINATARIO,
  subject: oggetto,
  html: htmlBody,
  attachments: allegati.map(file => ({
    filename: file.originalname,
    content: fs.readFileSync(file.path),
  })),
});
```

## Verifica Funzionamento

1. Assicurati che le variabili siano nel file `.env`
2. Riavvia il server
3. Prova a inviare una richiesta di assistenza dalla pagina "Assistenza"
4. Controlla i log del server per verificare l'invio

## Modalità Sviluppo

Se non ci sono credenziali configurate e `NODE_ENV=development`, il sistema simula l'invio (vedi console log) ma non invia realmente email.

