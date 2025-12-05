#!/bin/bash

COOKIE_JAR="/tmp/cookies.txt"
BASE_URL="http://localhost:3000"

echo "=== TESTE 1: Acessar página de login ==="
curl -s -c "$COOKIE_JAR" "$BASE_URL/login" | grep -o "<title>.*</title>"

echo -e "\n=== TESTE 2: Fazer login com credentials válidas ==="
curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=test@test.com&password=Test123!" \
  | grep -o '"success":\s*[^,}]*' | head -1

echo -e "\n=== TESTE 3: Acessar /animes (deve estar autenticado) ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/animes" | grep -o "<h1.*</h1>" | head -1

echo -e "\n=== TESTE 4: Acessar /profile (deve estar autenticado) ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/profile" | grep -o "<h1.*</h1>" | head -1

echo -e "\n=== TESTE 5: Tentar acessar /profile SEM autenticação (deve redirecionar) ==="
curl -s -i -b "/tmp/empty_cookies.txt" "$BASE_URL/profile" 2>&1 | grep -E "^HTTP|^Location"

echo -e "\n=== TESTE 6: Testar HTMX add button (POST /api/animes/1/add/htmx) ==="
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/animes/1/add/htmx" \
  -H "HX-Request: true" \
  | grep -o "class=\".*button.*\"" | head -1

echo -e "\n=== Testes concluídos ==="
