# Docker Setup - myMemorableAnimes

Este guia explica como executar o myMemorableAnimes usando Docker para desenvolvimento e produção.

## 📋 Pré-requisitos

-   [Docker](https://docs.docker.com/get-docker/) (versão 20.10+)
-   [Docker Compose](https://docs.docker.com/compose/install/) (versão 2.0+ ou plugin do Docker)
-   Git (para clonar o repositório)

### Verificar instalação

```bash
docker --version        # Docker version 20.10.x ou superior
docker compose version  # Docker Compose version v2.x.x
```

---

## 🚀 Início Rápido

### Desenvolvimento Local

```bash
# 1. Clone o repositório
git clone https://github.com/gabrieldnsilva/myMemorableAnimes.git
cd myMemorableAnimes

# 2. Copie o template de variáveis de ambiente
cp .env.production.template .env

# 3. Build e inicie o container
docker compose up -d --build

# 4. Verifique se está rodando
docker compose ps
docker compose logs -f app

# 5. Acesse a aplicação
open http://localhost:3000
```

### Parar a aplicação

```bash
docker compose down
```

---

## 📁 Arquivos Docker

| Arquivo                    | Descrição                                 |
| -------------------------- | ----------------------------------------- |
| `Dockerfile`               | Multi-stage build otimizado para produção |
| `.dockerignore`            | Arquivos excluídos do build               |
| `docker-compose.yml`       | Configuração base para desenvolvimento    |
| `docker-compose.prod.yml`  | Override para produção                    |
| `.env.production.template` | Template de variáveis de ambiente         |

---

## 🔧 Comandos Úteis

### Build

```bash
# Build simples
docker compose build

# Build sem cache (rebuild completo)
docker compose build --no-cache

# Build com progresso detalhado
docker compose build --progress=plain
```

### Execução

```bash
# Iniciar em background
docker compose up -d

# Iniciar com logs visíveis
docker compose up

# Iniciar apenas o app (sem serviços opcionais)
docker compose up -d app

# Reiniciar container
docker compose restart app
```

### Logs e Debug

```bash
# Ver logs em tempo real
docker compose logs -f app

# Ver últimas 100 linhas
docker compose logs --tail=100 app

# Entrar no container
docker compose exec app sh

# Verificar saúde do container
docker compose ps
curl http://localhost:3000/health
```

### Limpeza

```bash
# Parar containers
docker compose down

# Parar e remover volumes (CUIDADO: apaga dados!)
docker compose down -v

# Remover imagens não utilizadas
docker image prune -a

# Limpeza completa
docker system prune -a --volumes
```

---

## 🏭 Deploy em Produção

### 1. Configurar Variáveis de Ambiente

```bash
# Copie o template
cp .env.production.template .env

# Edite com valores de produção
nano .env  # ou vim, code, etc.
```

**Configurações críticas:**

```bash
# Gerar SESSION_SECRET seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Ou com openssl
openssl rand -hex 32
```

### 2. Build e Deploy

```bash
# Build da imagem de produção
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Iniciar em produção
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verificar status
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### 3. Deploy com Registry (CI/CD)

```bash
# Tag da imagem
docker tag mymemorableanimes:latest ghcr.io/gabrieldnsilva/mymemorableanimes:v2.0.0

# Push para registry
docker push ghcr.io/gabrieldnsilva/mymemorableanimes:v2.0.0

# No servidor de produção
docker pull ghcr.io/gabrieldnsilva/mymemorableanimes:v2.0.0
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 🗄️ Persistência de Dados

### Volume SQLite (Padrão)

O banco de dados SQLite é persistido em um volume Docker nomeado:

```bash
# Listar volumes
docker volume ls | grep mymemorableanimes

# Inspecionar volume
docker volume inspect mymemorableanimes_database

# Backup do banco de dados
docker compose exec app cat /app/database/database.db > backup.db

# Restaurar backup
docker cp backup.db mymemorableanimes-app:/app/database/database.db
docker compose restart app
```

### PostgreSQL (Opcional)

Para usar PostgreSQL em vez de SQLite:

1. Descomente as seções `postgres` em `docker-compose.yml`
2. Configure as variáveis `DB_*` no `.env`
3. Atualize `DATABASE_URL` para usar PostgreSQL

```bash
DATABASE_URL=postgresql://animes:senha-segura@postgres:5432/mymemorableanimes
```

---

## 🔒 Segurança

### Checklist de Produção

-   [ ] `SESSION_SECRET` é único e tem 64+ caracteres
-   [ ] `SECURE_COOKIES=true` (requer HTTPS)
-   [ ] Arquivo `.env` com permissões restritas (`chmod 600`)
-   [ ] Container roda como usuário não-root (nodejs:1001)
-   [ ] Health checks ativos
-   [ ] Reverse proxy com SSL/TLS (nginx, traefik, etc.)
-   [ ] Firewall configurado (apenas portas 80/443 expostas)
-   [ ] Logs não contêm dados sensíveis
-   [ ] Backups automáticos do banco de dados

### Boas Práticas

```bash
# Verificar se roda como non-root
docker compose exec app whoami  # Deve retornar: nodejs

# Verificar processos
docker compose exec app ps aux

# Verificar permissões do banco
docker compose exec app ls -la /app/database
```

---

## 📊 Monitoramento

### Health Check

```bash
# Via curl
curl -s http://localhost:3000/health | jq

# Resposta esperada:
# {
#   "status": "OK",
#   "uptime": 123.456
# }
```

### Docker Health Status

```bash
# Ver status de saúde
docker compose ps

# Saída esperada:
# NAME                    STATUS                   PORTS
# mymemorableanimes-app   Up 5 minutes (healthy)   0.0.0.0:3000->3000/tcp
```

### Métricas do Container

```bash
# Uso de recursos em tempo real
docker stats mymemorableanimes-app

# Informações detalhadas
docker inspect mymemorableanimes-app
```

---

## 🐛 Troubleshooting

### Container não inicia

```bash
# Ver logs de erro
docker compose logs app

# Verificar eventos do Docker
docker events --filter container=mymemorableanimes-app

# Build com verbose
docker compose build --progress=plain 2>&1 | tee build.log
```

### Problemas de permissão

```bash
# Verificar ownership do volume
docker compose exec app ls -la /app/database

# Corrigir permissões (se necessário)
docker compose exec -u root app chown -R nodejs:nodejs /app/database
```

### Health check falhando

```bash
# Testar endpoint manualmente
docker compose exec app curl -v http://localhost:3000/health

# Ver logs específicos
docker compose logs app 2>&1 | grep -i "error\|health"
```

### Build lento

```bash
# Usar BuildKit para builds mais rápidos
DOCKER_BUILDKIT=1 docker compose build

# Limpar cache de build
docker builder prune
```

---

## 🔄 Atualizações

### Zero-Downtime Update

```bash
# Pull nova versão
docker compose pull

# Restart com nova imagem
docker compose up -d --force-recreate

# Verificar se está healthy
docker compose ps
```

### Rollback

```bash
# Voltar para versão anterior
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d \
  --force-recreate \
  -e IMAGE_TAG=v1.9.0
```

---

## 📚 Recursos Adicionais

-   [Docker Documentation](https://docs.docker.com/)
-   [Docker Compose Specification](https://docs.docker.com/compose/compose-file/)
-   [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
-   [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs: `docker compose logs -f app`
2. Consulte este guia de troubleshooting
3. Abra uma [issue no GitHub](https://github.com/gabrieldnsilva/myMemorableAnimes/issues)
