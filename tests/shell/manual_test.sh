#!/bin/bash

COOKIE_JAR="/tmp/test_cookies.txt"
BASE_URL="http://localhost:3000"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   TESTE DE FUNCIONALIDADES - myMemorableAnimes v2.0     ║"
echo "╚═══════════════════════════════════════════════════════════╝"

echo -e "\n✓ TESTE 1: Login (credentials corretas)"
LOGIN_RESPONSE=$(curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=test@test.com&password=Test123!")
if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
  echo "  ✅ Login bem-sucedido"
else
  echo "  ❌ Login falhou"
fi

echo -e "\n✓ TESTE 2: Session persistence - Acessar /animes (rota protegida)"
ANIMES_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/animes")
if echo "$ANIMES_RESPONSE" | grep -q "<h1"; then
  echo "  ✅ Session persiste - acesso permitido a /animes"
else
  echo "  ❌ Sem acesso a /animes"
fi

echo -e "\n✓ TESTE 3: HTMX Add to List (POST /api/animes/1/add/htmx)"
ADD_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/animes/1/add/htmx" \
  -H "HX-Request: true")
if echo "$ADD_RESPONSE" | grep -q "success\|Adicionado\|button"; then
  echo "  ✅ HTMX Add endpoint retornou resposta"
else
  echo "  ❌ HTMX Add falhou"
fi

echo -e "\n✓ TESTE 4: HTMX Favorite toggle (PATCH /api/animes/1/favorite/htmx)"
FAV_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X PATCH "$BASE_URL/api/animes/1/favorite/htmx" \
  -H "HX-Request: true")
if echo "$FAV_RESPONSE" | grep -q "button\|favorite"; then
  echo "  ✅ HTMX Favorite endpoint retornou resposta"
else
  echo "  ⚠️  HTMX Favorite retornou: $(echo $FAV_RESPONSE | head -c 50)"
fi

echo -e "\n✓ TESTE 5: HTMX Remove from List (DELETE /api/animes/1/list/htmx)"
REMOVE_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X DELETE "$BASE_URL/api/animes/1/list/htmx" \
  -H "HX-Request: true")
if [ -z "$REMOVE_RESPONSE" ] || echo "$REMOVE_RESPONSE" | grep -q "success\|removed"; then
  echo "  ✅ HTMX Remove endpoint respondeu"
else
  echo "  ⚠️  HTMX Remove retornou: $(echo $REMOVE_RESPONSE | head -c 50)"
fi

echo -e "\n✓ TESTE 6: Session persiste em múltiplas navegações"
PROFILE_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/profile")
if echo "$PROFILE_RESPONSE" | grep -q "Perfil\|Email"; then
  echo "  ✅ Session persiste em /profile"
else
  echo "  ❌ Session perdida em /profile"
fi

echo -e "\n✓ TESTE 7: Route protection - Acessar /animes SEM session"
UNAUTH_RESPONSE=$(curl -s -i -b "/tmp/empty.txt" "$BASE_URL/animes" 2>&1)
if echo "$UNAUTH_RESPONSE" | grep -q "302\|Location: /login"; then
  echo "  ✅ Route protection funcionando (302 redirect)"
else
  echo "  ❌ Route protection não funcionando"
fi

echo -e "\n✓ TESTE 8: Logout (deve redirecionar para home)"
LOGOUT_RESPONSE=$(curl -s -i -b "$COOKIE_JAR" -c "$COOKIE_JAR" "$BASE_URL/api/auth/logout" 2>&1)
if echo "$LOGOUT_RESPONSE" | grep -q "Location: /"; then
  echo "  ✅ Logout redireciona para home"
else
  echo "  ⚠️  Logout response: $(echo $LOGOUT_RESPONSE | grep -i location)"
fi

echo -e "\n╔═══════════════════════════════════════════════════════════╗"
echo "║              ✅ TESTES CONCLUÍDOS                          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
