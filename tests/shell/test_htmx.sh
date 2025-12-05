#!/bin/bash

COOKIE_JAR="/tmp/htmx_test_cookies.txt"
BASE_URL="http://localhost:3000"

echo "=== 1. Login ==="
LOGIN_RESP=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST "$BASE_URL/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=test@test.com&password=Test123!" \
  -L -w "\nHTTP_CODE:%{http_code}")

echo "Response code: $(echo "$LOGIN_RESP" | grep "HTTP_CODE" | cut -d: -f2)"

echo -e "\n=== 2. Test Add Button (HTMX POST) ==="
ADD_RESP=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/animes/1/add/htmx" \
  -H "HX-Request: true" \
  -w "\nHTTP_CODE:%{http_code}")

echo "Response:"
echo "$ADD_RESP" | head -20

echo -e "\n=== 3. Test Favorite Button (HTMX PATCH) ==="
FAV_RESP=$(curl -s -b "$COOKIE_JAR" -X PATCH "$BASE_URL/api/animes/1/favorite/htmx" \
  -H "HX-Request: true" \
  -w "\nHTTP_CODE:%{http_code}")

echo "Response:"
echo "$FAV_RESP" | head -20
