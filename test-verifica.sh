#!/bin/bash

# Script di verifica stato backend Railway

echo "🔍 Verifica Stato Backend Railway"
echo "=================================="
echo ""

# Chiedi URL backend
read -p "Inserisci l'URL del tuo backend Railway (es: https://xxx.up.railway.app): " BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
  echo "❌ URL non fornito"
  exit 1
fi

echo ""
echo "📡 Test Health Check..."
echo "URL: $BACKEND_URL/api/health"
echo ""

HEALTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BACKEND_URL/api/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Health Check OK"
  echo "Risposta: $RESPONSE_BODY"
else
  echo "❌ Health Check Fallito"
  echo "HTTP Code: $HTTP_CODE"
  echo "Risposta: $RESPONSE_BODY"
fi

echo ""
echo "📡 Test Endpoint Migrazione (verifica disponibilità)..."
echo "URL: $BACKEND_URL/api/migrate/supabase-to-railway"
echo ""

MIGRATE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BACKEND_URL/api/migrate/supabase-to-railway" -H "Content-Type: application/json")
MIGRATE_HTTP_CODE=$(echo "$MIGRATE_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
MIGRATE_BODY=$(echo "$MIGRATE_RESPONSE" | sed '/HTTP_CODE/d')

echo "HTTP Code: $MIGRATE_HTTP_CODE"
echo "Risposta: $MIGRATE_BODY"

if [ "$MIGRATE_HTTP_CODE" = "400" ]; then
  echo "⚠️  Endpoint disponibile ma mancano configurazioni (normale se non hai ancora aggiunto SUPABASE_DATABASE_URL)"
elif [ "$MIGRATE_HTTP_CODE" = "200" ]; then
  echo "✅ Endpoint funzionante!"
else
  echo "❌ Endpoint non disponibile o errore"
fi

echo ""
echo "=================================="
echo "✅ Verifica completata!"

