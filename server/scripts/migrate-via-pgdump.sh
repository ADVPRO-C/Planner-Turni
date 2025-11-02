#!/bin/bash

# Script per migrare i dati da Supabase a Railway usando pg_dump e psql

# Connection strings
SUPABASE_URL="postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres"
RAILWAY_URL="postgresql://postgres:vyiPjmjNpiYugHWGFmtSXCKMImXVpHDV@ballast.proxy.rlwy.net:30883/railway"

echo "🚀 Migrazione via pg_dump/psql"
echo "================================"

# Esporta schema e dati da Supabase
echo "📦 Esportazione dati da Supabase..."
pg_dump "$SUPABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --format=plain \
  --file=supabase_dump.sql

if [ $? -ne 0 ]; then
  echo "❌ Errore durante l'esportazione da Supabase"
  exit 1
fi

echo "✅ Dati esportati in supabase_dump.sql"

# Importa in Railway
echo "📥 Importazione dati in Railway..."
psql "$RAILWAY_URL" < supabase_dump.sql

if [ $? -ne 0 ]; then
  echo "❌ Errore durante l'importazione in Railway"
  exit 1
fi

echo "✅ Migrazione completata!"

# Pulisci file temporaneo
rm -f supabase_dump.sql

