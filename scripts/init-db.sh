#!/bin/bash

# Script per inizializzare il database PostgreSQL per Planner Turni

set -e

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurazione database
DB_NAME="planner_turni"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

echo -e "${YELLOW}🚀 Inizializzazione Database Planner Turni${NC}"
echo "=================================="

# Verifica se PostgreSQL è installato
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL non è installato o non è nel PATH${NC}"
    echo "Installa PostgreSQL e riprova"
    exit 1
fi

# Verifica se il database esiste
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${YELLOW}⚠️  Il database '$DB_NAME' esiste già${NC}"
    read -p "Vuoi ricrearlo? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🗑️  Eliminazione database esistente...${NC}"
        dropdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
    else
        echo -e "${GREEN}✅ Database mantenuto${NC}"
        exit 0
    fi
fi

# Crea il database
echo -e "${YELLOW}📦 Creazione database '$DB_NAME'...${NC}"
createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME

# Esegui lo schema
echo -e "${YELLOW}🏗️  Esecuzione schema del database...${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f server/database/schema.sql

# Esegui i dati di esempio
echo -e "${YELLOW}📊 Inserimento dati di esempio...${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f server/config/database-dev.sql

echo -e "${GREEN}✅ Database inizializzato con successo!${NC}"
echo ""
echo -e "${GREEN}📋 Credenziali di accesso:${NC}"
echo "   Email: admin@planner.com"
echo "   Password: password123"
echo ""
echo -e "${GREEN}🔗 Per avviare l'applicazione:${NC}"
echo "   npm run dev"
echo ""
echo -e "${GREEN}🌐 L'applicazione sarà disponibile su:${NC}"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000" 