# API Documentation - Planner Turni

## Base URL

```
http://localhost:5000/api
```

## Autenticazione

L'API utilizza JWT (JSON Web Tokens) per l'autenticazione. Includi il token nell'header `Authorization`:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Autenticazione

#### POST /auth/login

Effettua il login di un utente.

**Request Body:**

```json
{
  "email": "admin@planner.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nome": "Admin",
    "cognome": "Sistema",
    "email": "admin@planner.com",
    "sesso": "M",
    "ruolo": "admin",
    "stato": "attivo"
  }
}
```

#### POST /auth/register

Registra un nuovo utente.

**Request Body:**

```json
{
  "nome": "Mario",
  "cognome": "Rossi",
  "email": "mario.rossi@email.com",
  "password": "password123",
  "sesso": "M",
  "ruolo": "volontario"
}
```

#### GET /auth/verify

Verifica la validità del token JWT.

**Headers:**

```
Authorization: Bearer <token>
```

#### PUT /auth/profile

Aggiorna il profilo dell'utente.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "nome": "Mario",
  "cognome": "Rossi",
  "email": "mario.rossi@email.com"
}
```

### Volontari

#### GET /volontari

Ottiene la lista dei volontari.

**Query Parameters:**

- `stato`: Filtra per stato (attivo/non_attivo)
- `sesso`: Filtra per sesso (M/F)
- `search`: Cerca per nome o cognome
- `page`: Numero di pagina
- `limit`: Numero di risultati per pagina

#### GET /volontari/:id

Ottiene i dettagli di un volontario specifico.

#### POST /volontari

Crea un nuovo volontario (solo admin).

**Request Body:**

```json
{
  "nome": "Mario",
  "cognome": "Rossi",
  "email": "mario.rossi@email.com",
  "password": "password123",
  "sesso": "M",
  "stato": "attivo"
}
```

#### PUT /volontari/:id

Aggiorna un volontario (solo admin).

#### DELETE /volontari/:id

Elimina un volontario (solo admin).

### Postazioni

#### GET /postazioni

Ottiene la lista delle postazioni.

**Query Parameters:**

- `stato`: Filtra per stato (attiva/inattiva)
- `giorno`: Filtra per giorno della settimana (1-7)
- `search`: Cerca per luogo

#### GET /postazioni/:id

Ottiene i dettagli di una postazione specifica.

#### POST /postazioni

Crea una nuova postazione (solo admin).

**Request Body:**

```json
{
  "luogo": "Piazza del Duomo",
  "indirizzo": "Piazza del Duomo, Milano",
  "orario_inizio": "09:00",
  "orario_fine": "11:00",
  "giorni_settimana": [1, 2, 3, 4, 5, 6, 7],
  "stato": "attiva"
}
```

#### PUT /postazioni/:id

Aggiorna una postazione (solo admin).

#### DELETE /postazioni/:id

Elimina una postazione (solo admin).

### Disponibilità

#### GET /disponibilita

Ottiene le disponibilità dei volontari.

**Query Parameters:**

- `volontario_id`: Filtra per volontario
- `data_inizio`: Data di inizio
- `data_fine`: Data di fine
- `stato`: Filtra per stato

#### POST /disponibilita

Inserisce una nuova disponibilità.

**Request Body:**

```json
{
  "volontario_id": 1,
  "data": "2024-01-15",
  "orario_inizio": "09:00",
  "orario_fine": "11:00",
  "stato": "disponibile",
  "note": "Disponibile per turno mattutino"
}
```

#### PUT /disponibilita/:id

Aggiorna una disponibilità.

#### DELETE /disponibilita/:id

Elimina una disponibilità.

### Turni (Assegnazioni)

#### GET /turni

Ottiene la lista dei turni.

**Query Parameters:**

- `data_inizio`: Data di inizio
- `data_fine`: Data di fine
- `postazione_id`: Filtra per postazione
- `volontario_id`: Filtra per volontario
- `stato`: Filtra per stato

#### GET /turni/:id

Ottiene i dettagli di un turno specifico.

#### POST /turni

Crea un nuovo turno (solo admin).

**Request Body:**

```json
{
  "postazione_id": 1,
  "data_turno": "2024-01-15",
  "orario_inizio": "09:00",
  "orario_fine": "11:00",
  "volontari": [1, 2, 3],
  "note": "Turno mattutino"
}
```

#### PUT /turni/:id

Aggiorna un turno (solo admin).

#### DELETE /turni/:id

Elimina un turno (solo admin).

#### POST /turni/assegna-automatico

Assegna automaticamente i turni (solo admin).

**Request Body:**

```json
{
  "data_inizio": "2024-01-15",
  "data_fine": "2024-01-21",
  "postazioni": [1, 2, 3]
}
```

### Cronologia

#### GET /cronologia

Ottiene la cronologia dei turni completati.

**Query Parameters:**

- `data_inizio`: Data di inizio
- `data_fine`: Data di fine
- `postazione_id`: Filtra per postazione
- `volontario_id`: Filtra per volontario
- `page`: Numero di pagina
- `limit`: Numero di risultati per pagina

#### GET /cronologia/statistiche

Ottiene le statistiche della cronologia.

**Query Parameters:**

- `data_inizio`: Data di inizio
- `data_fine`: Data di fine
- `tipo`: Tipo di statistica (giornaliera/settimanale/mensile)

#### GET /cronologia/export-pdf

Esporta la cronologia in PDF.

**Query Parameters:**

- `data_inizio`: Data di inizio
- `data_fine`: Data di fine
- `postazione_id`: Filtra per postazione

### Notifiche

#### GET /notifiche

Ottiene le notifiche dell'utente.

**Query Parameters:**

- `letta`: Filtra per stato di lettura
- `tipo`: Filtra per tipo di notifica

#### PUT /notifiche/:id/leggi

Segna una notifica come letta.

## Codici di Risposta

- `200` - Successo
- `201` - Creato con successo
- `400` - Richiesta non valida
- `401` - Non autorizzato
- `403` - Accesso negato
- `404` - Non trovato
- `500` - Errore interno del server

## Esempi di Utilizzo

### Login e Accesso

```javascript
// Login
const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "admin@planner.com",
    password: "password123",
  }),
});

const { token, user } = await response.json();

// Usa il token per le richieste successive
const volontariResponse = await fetch("/api/volontari", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### Gestione Errori

```javascript
try {
  const response = await fetch("/api/volontari");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  const data = await response.json();
} catch (error) {
  console.error("Errore:", error.message);
}
```

## Rate Limiting

L'API implementa rate limiting per prevenire abusi:

- 100 richieste per finestra di 15 minuti
- Headers di risposta: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
