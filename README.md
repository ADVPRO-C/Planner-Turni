# 📅 Planner Turni - Sistema di Gestione Turni

Un sistema completo per la gestione dei turni dei volontari, sviluppato con React frontend e Node.js backend.

## 🚀 Caratteristiche

- **Gestione Volontari**: Registrazione e gestione dei volontari
- **Gestione Postazioni**: Configurazione delle postazioni di servizio
- **Sistema Disponibilità**: Inserimento e gestione delle disponibilità
- **Assegnazione Turni**: Sistema automatico e manuale di assegnazione
- **Dashboard Interattiva**: Vista d'insieme con statistiche e turni personali
- **Cronologia**: Storico completo dei turni svolti
- **Autenticazione**: Sistema di login con ruoli (admin/volontario)

## 🛠️ Tecnologie Utilizzate

### Frontend

- **React 18** - Framework UI
- **Tailwind CSS** - Styling
- **Heroicons** - Icone
- **React Router** - Navigazione
- **React Hot Toast** - Notifiche

### Backend

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Database
- **JWT** - Autenticazione
- **Joi** - Validazione dati

## 📋 Prerequisiti

- Node.js (versione 16 o superiore)
- PostgreSQL (versione 12 o superiore)
- npm o yarn

## 🔧 Installazione

### 1. Clona il repository

```bash
git clone https://github.com/tuousername/planner-turni.git
cd planner-turni
```

### 2. Installa le dipendenze

```bash
# Dipendenze root
npm install

# Dipendenze client
cd client
npm install

# Dipendenze server
cd ../server
npm install
```

### 3. Configura il database

```bash
# Crea il database PostgreSQL
createdb planner_db

# Inizializza lo schema
psql -d planner_db -f server/database/schema.sql

# Inserisci i dati di base
psql -d planner_db -f server/config/database-dev.sql
```

### 4. Configura le variabili d'ambiente

Crea un file `.env` nella root del progetto:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=planner_db
DB_USER=your_username
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key

# Server
PORT=5001
NODE_ENV=development
```

### 5. Avvia l'applicazione

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

L'applicazione sarà disponibile su:

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5001

## 👥 Ruoli Utente

### Admin

- Gestione completa di volontari e postazioni
- Assegnazione automatica e manuale dei turni
- Accesso a tutte le statistiche e report
- Gestione delle disponibilità

### Volontario

- Visualizzazione dei propri turni assegnati
- Inserimento delle proprie disponibilità
- Accesso alla cronologia personale
- Modifica del proprio profilo

## 📊 Struttura del Progetto

```
PLANNER/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componenti riutilizzabili
│   │   ├── pages/         # Pagine dell'applicazione
│   │   ├── contexts/      # Context React
│   │   ├── utils/         # Utility e API
│   │   └── config/        # Configurazioni
│   └── public/            # File pubblici
├── server/                # Backend Node.js
│   ├── routes/            # Route API
│   ├── config/            # Configurazioni database
│   ├── database/          # Schema e script SQL
│   └── scripts/           # Script di utilità
├── docs/                  # Documentazione
└── scripts/               # Script di inizializzazione
```

## 🔐 Credenziali di Default

### Admin

- **Email**: admin@planner.com
- **Password**: password123

### Volontario di Test

- **Email**: giulia.bianchi@email.com
- **Password**: password123

## 📝 API Documentation

L'API è documentata nel file `docs/API.md` con tutti gli endpoint disponibili.

## 🚀 Deployment

### Produzione

```bash
# Build del frontend
cd client
npm run build

# Avvio del server in produzione
cd ../server
NODE_ENV=production npm start
```

### Docker (opzionale)

```bash
# Build dell'immagine
docker build -t planner-turni .

# Avvio del container
docker run -p 3000:3000 -p 5001:5001 planner-turni
```

## 🤝 Contribuire

1. Fork il progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit le tue modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.

## 👨‍💻 Sviluppatore

**D.Arena** - [GitHub](https://github.com/darena)

---

⭐ Se questo progetto ti è stato utile, considera di dargli una stella su GitHub!
