# Deployment Guide - myMemorableAnimes

## Opção 1: Railway (Recomendado - Simples)

### Pré-requisitos

-   Conta no [Railway.app](https://railway.app)
-   Projeto conectado ao GitHub

### Passos

1. **Criar novo projeto no Railway**

    - Login em railway.app
    - New Project → GitHub Repo
    - Selecionar `myMemorableAnimes` repository
    - Authorizar Railway a acessar seu GitHub

2. **Configurar variáveis de ambiente**

    - No painel do Railway, ir para "Variables"
    - Adicionar:
        ```
        NODE_ENV=production
        PORT=3000
        SESSION_SECRET=seu-secret-key-muito-seguro-aqui
        DATABASE_URL=./database/database.db
        JIKAN_API_BASE=https://api.jikan.moe/v4
        ```

3. **Configurar build command**

    - Build Command: `npm run build`
    - Start Command: `npm start`

4. **Deploy**

    - Railway automaticamente detecta `package.json`
    - Clica "Deploy" e aguarda

5. **Acessar aplicação**
    - Railway gera URL automática
    - Ex: `https://mymemorableanimes-production.up.railway.app`

---

## Opção 2: Render (Alternativa gratuita)

### Pré-requisitos

-   Conta no [Render.com](https://render.com)
-   Projeto no GitHub

### Passos

1. **Criar novo Web Service**

    - Login em render.com
    - New → Web Service
    - Conectar repositório GitHub
    - Selecionar `myMemorableAnimes`

2. **Configurar build**

    - Name: `myMemorableAnimes`
    - Environment: `Node`
    - Build Command: `npm run build`
    - Start Command: `npm start`
    - Instance Type: Free (ou Paid se preferir)

3. **Definir Environment Variables**

    - Em "Environment", adicionar:
        ```
        NODE_ENV=production
        SESSION_SECRET=seu-secret-key-muito-seguro-aqui
        DATABASE_URL=./database/database.db
        JIKAN_API_BASE=https://api.jikan.moe/v4
        ```

4. **Deploy**

    - Clica "Create Web Service"
    - Render faz deploy automaticamente

5. **Acessar**
    - Ex: `https://mymemorableanimes.onrender.com`

---

## Opção 3: Docker (Heroku, AWS, etc)

### Criar Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Build app
RUN npm run build

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
```

### Criar .dockerignore

```
node_modules
npm-debug.log
.git
.gitignore
README.md
e2e
tests
```

### Build e deploy

```bash
# Build image
docker build -t mymemorableanimes .

# Test locally
docker run -p 3000:3000 -e NODE_ENV=production mymemorableanimes

# Push para registry (ex: Docker Hub)
docker tag mymemorableanimes:latest seu-usuario/mymemorableanimes:latest
docker push seu-usuario/mymemorableanimes:latest
```

---

## Verificações pré-produção

### 1. Variáveis de Ambiente

```bash
# Verificar que todas as vars obrigatórias existem
- NODE_ENV=production
- PORT (default 3000)
- SESSION_SECRET (min 32 caracteres, único)
- DATABASE_URL (caminho SQLite ou string de conexão)
- JIKAN_API_BASE
```

### 2. Build

```bash
npm run build
```

-   Sem erros TypeScript
-   Views copiadas para dist/views
-   CSS compilado (minified em production)

### 3. Testes

```bash
npm test
```

-   Cobertura >70% (target do projeto)
-   Todos os testes passam

### 4. E2E Tests (Opcional)

```bash
npm run test:e2e
```

-   Valida fluxos críticos em ambiente real

### 5. Lighthouse (Opcional)

```bash
# Requer app rodando
npm start
# Em outro terminal:
lhci autorun --config=lighthouserc.json
```

---

## Variáveis de Ambiente - Referência Completa

| Variável       | Obrigatória | Default                  | Descrição                                      |
| -------------- | ----------- | ------------------------ | ---------------------------------------------- |
| NODE_ENV       | Sim         | development              | `production` para prod, `development` para dev |
| PORT           | Não         | 3000                     | Porta HTTP                                     |
| SESSION_SECRET | Sim         | -                        | Chave para encriptar sessions (min 32 chars)   |
| DATABASE_URL   | Não         | ./database/database.db   | Caminho SQLite (relativo a `dist/`)            |
| JIKAN_API_BASE | Não         | https://api.jikan.moe/v4 | Base URL da API MyAnimeList                    |

### Gerar SESSION_SECRET seguro

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Monitoramento em Produção

### Railway/Render Logs

-   Aceda aos logs via dashboard
-   Procure por erros `[ERR]` e `[WARN]`

### Verificar Health

```bash
curl https://seu-dominio.com/health
```

Deve retornar:

```json
{
	"status": "OK",
	"uptime": 123.45
}
```

---

## Troubleshooting

### Erro: "Database not found"

-   Verificar caminho de `DATABASE_URL`
-   Railway/Render criam o arquivo automaticamente na primeira execução
-   Se usar SQLite, ensure o diretório `database/` existe

### Erro: "Invalid SESSION_SECRET"

-   SESSION_SECRET deve ter mínimo 32 caracteres
-   Regenerar com: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Erro: "CORS blocked"

-   Helmet CSP pode bloquear recursos CDN (Alpine.js, HTMX, fonts)
-   Verificar `src/server.ts` linha ~25:
    ```typescript
    helmet({ contentSecurityPolicy: false });
    ```

### App lento em produção

-   Rodar Lighthouse: `npm run test:e2e && lhci autorun`
-   Otimizar imagens (WebP, compressão)
-   Usar CDN para assets estáticos

---

## Próximos Passos

1. **CI/CD Pipeline** (GitHub Actions)

    ```yaml
    # .github/workflows/deploy.yml
    - Rodar testes (npm test)
    - Rodar E2E (npm run test:e2e)
    - Rodar Lighthouse (opcional)
    - Deploy automático ao Railway/Render
    ```

2. **Monitoramento**

    - Sentry para error tracking
    - DataDog/New Relic para performance

3. **Backups**

    - Railway: backups automáticos
    - Render: considere usar PostgreSQL managed
    - SQLite local: considere migrar para PostgreSQL em prod

4. **Segurança**
    - HTTPS automático (Railway/Render)
    - Rate limiting (middleware)
    - Input validation (express-validator)
    - CSRF tokens (se adicionar forms POST)

---

## Checklist Final de Deploy

-   [ ] NODE_ENV=production
-   [ ] SESSION_SECRET configurado e seguro (32+ chars)
-   [ ] Testes passando (npm test >70% coverage)
-   [ ] Build sem erros (npm run build)
-   [ ] App inicia sem erros (npm start)
-   [ ] /health endpoint respondendo
-   [ ] Database criada e migrada
-   [ ] Variáveis de ambiente todas definidas
-   [ ] Domain/URL apontando para aplicação
-   [ ] SSL/HTTPS configurado
-   [ ] Logs monitoráveis
-   [ ] Email de recuperação de senha (opcional: implementar)

---

**Autor**: Gabriel Danilo  
**Data**: 6 de Dezembro de 2025  
**Versão**: 1.0 - Production Ready
