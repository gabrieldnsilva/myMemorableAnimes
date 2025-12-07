# SonarQube Cloud Setup - myMemorableAnimes

Guia completo para configurar e usar SonarQube Cloud para análise de qualidade de código.

## 📋 Índice

-   [Pré-requisitos](#pré-requisitos)
-   [Configuração Inicial](#configuração-inicial)
-   [GitHub Actions Integration](#github-actions-integration)
-   [Métricas e Quality Gates](#métricas-e-quality-gates)
-   [Análise Local](#análise-local)
-   [Troubleshooting](#troubleshooting)

---

## 🎯 Pré-requisitos

-   Conta no [SonarCloud](https://sonarcloud.io/)
-   Repositório no GitHub
-   Node.js 20+ instalado localmente

---

## 🚀 Configuração Inicial

### 1. Criar Projeto no SonarCloud

1. Acesse [SonarCloud.io](https://sonarcloud.io/)
2. Faça login com sua conta GitHub
3. Clique em **"+"** → **"Analyze new project"**
4. Selecione o repositório `myMemorableAnimes`
5. Configure a organização (se necessário)

### 2. Obter Tokens

#### Token do SonarCloud

1. No SonarCloud, vá em **"My Account"** → **"Security"**
2. Gere um novo token:
    - **Name**: `GitHub Actions - myMemorableAnimes`
    - **Type**: `User Token`
    - **Expiration**: `No expiration` (ou defina um período)
3. **Copie o token** (você não verá novamente!)

#### Adicionar Token no GitHub

1. No GitHub, vá em **Settings** → **Secrets and variables** → **Actions**
2. Clique em **"New repository secret"**
3. Configure:
    - **Name**: `SONAR_TOKEN`
    - **Secret**: Cole o token do SonarCloud
4. Salve o secret

### 3. Configurar Project Key

No arquivo `sonar-project.properties`, ajuste os valores:

```properties
sonar.projectKey=SEU_USUARIO_myMemorableAnimes
sonar.organization=SEU_USUARIO
```

**Onde encontrar esses valores:**

-   **Project Key**: Visível no dashboard do projeto no SonarCloud
-   **Organization**: Sua organização no SonarCloud (geralmente seu username)

---

## 🔄 GitHub Actions Integration

### Pipeline Automático

O workflow `.github/workflows/ci-cd-sonarqube.yml` executa automaticamente em:

-   **Push** para `main`, `develop`, ou branches `feature/*`
-   **Pull Requests** para `main` ou `develop`

### O que o pipeline faz

1. **Testes**: Executa `npm test` com cobertura
2. **Lint**: Verifica código com ESLint
3. **SonarQube**: Analisa qualidade do código
4. **Quality Gate**: Verifica se o código passa nos critérios de qualidade
5. **Build**: Compila TypeScript

### Visualizar Resultados

Após cada commit/PR:

1. Vá em **Actions** no GitHub
2. Clique no workflow em execução
3. Verifique cada job (test, sonarqube, build)

**Pull Request Decoration:**

-   Comentários automáticos do SonarCloud em PRs
-   Status de Quality Gate no PR
-   Link direto para análise detalhada

---

## 📊 Métricas e Quality Gates

### Métricas Principais

| Métrica               | Meta     | Descrição                     |
| --------------------- | -------- | ----------------------------- |
| **Coverage**          | ≥70%     | Cobertura de testes           |
| **Bugs**              | 0        | Problemas críticos de código  |
| **Vulnerabilities**   | 0        | Problemas de segurança        |
| **Code Smells**       | ≤50      | Problemas de manutenibilidade |
| **Duplications**      | ≤3%      | Código duplicado              |
| **Security Hotspots** | Reviewed | Pontos críticos revisados     |

### Quality Gate Padrão

O SonarCloud usa o quality gate padrão "Sonar way":

-   ✅ **New code**: Coverage ≥80%
-   ✅ **New code**: Duplications ≤3%
-   ✅ **New code**: Maintainability A ou B
-   ✅ **Overall**: No vulnerabilities or bugs

### Customizar Quality Gate (Opcional)

1. No SonarCloud, vá em **Quality Gates**
2. Crie um novo quality gate ou customize o padrão
3. Associe ao projeto

---

## 💻 Análise Local

### Instalar SonarScanner

**macOS (Homebrew):**

```bash
brew install sonar-scanner
```

**Linux:**

```bash
# Download from https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/
wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip
unzip sonar-scanner-cli-5.0.1.3006-linux.zip
export PATH=$PATH:$PWD/sonar-scanner-5.0.1.3006-linux/bin
```

**Windows:**

```powershell
choco install sonarscanner
```

### Executar Análise Local

```bash
# 1. Gerar cobertura de testes
npm test

# 2. Executar análise SonarQube
sonar-scanner \
  -Dsonar.token=SEU_TOKEN_AQUI \
  -Dsonar.host.url=https://sonarcloud.io

# 3. Ver resultados
# Acesse o link fornecido no terminal
```

### Variáveis de Ambiente (Opcional)

Crie um arquivo `.env.sonar` (não committar!):

```bash
SONAR_TOKEN=seu-token-aqui
SONAR_HOST_URL=https://sonarcloud.io
```

Execute:

```bash
source .env.sonar
sonar-scanner
```

---

## 🔍 Análise de Resultados

### Dashboard do SonarCloud

Acesse: `https://sonarcloud.io/project/overview?id=seu-project-key`

**Abas principais:**

1. **Overview**: Resumo geral de qualidade
2. **Issues**: Lista de problemas encontrados
3. **Security Hotspots**: Pontos críticos de segurança
4. **Measures**: Métricas detalhadas
5. **Code**: Navegação pelo código com anotações
6. **Activity**: Histórico de análises

### Tipos de Issues

| Tipo                 | Severidade | Descrição                                    |
| -------------------- | ---------- | -------------------------------------------- |
| **Bug**              | Alta       | Problemas que causam comportamento incorreto |
| **Vulnerability**    | Crítica    | Problemas de segurança                       |
| **Code Smell**       | Média      | Problemas de manutenibilidade                |
| **Security Hotspot** | Variável   | Requer revisão manual                        |

### Priorização

Foque primeiro em:

1. ❗ **Vulnerabilities** (segurança)
2. 🐛 **Bugs** (comportamento)
3. 🔴 **Blocker/Critical** Code Smells
4. 🟡 **Major** Code Smells

---

## 🛠️ Configuração Avançada

### Excluir Arquivos da Análise

Edite `sonar-project.properties`:

```properties
sonar.exclusions=\
  **/*.test.ts,\
  src/scripts/**,\
  src/types/**
```

Ou use `.sonarignore`:

```
src/scripts/seedAnimes.ts
```

### Ajustar Thresholds de Cobertura

Em `sonar-project.properties`:

```properties
sonar.coverage.minimum=70
```

Ou no UI do SonarCloud:

1. **Project Settings** → **General Settings** → **Coverage**
2. Defina o threshold desejado

### Desabilitar Regras Específicas

No SonarCloud:

1. **Quality Profiles** → **Your Profile**
2. **Deactivate** regras indesejadas
3. Ou crie um perfil customizado

---

## 🐛 Troubleshooting

### Erro: "No coverage data found"

**Problema**: SonarQube não encontra o arquivo de cobertura.

**Solução**:

```bash
# 1. Verificar se lcov.info existe
ls -la coverage/lcov.info

# 2. Verificar caminho no sonar-project.properties
sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

### Erro: "Quality gate failed"

**Problema**: Código não passa nos critérios de qualidade.

**Solução**:

1. Acesse o dashboard do SonarCloud
2. Veja quais métricas falharam
3. Corrija os issues prioritários
4. Commit novamente

### Erro: "Authentication required"

**Problema**: Token do SonarCloud inválido ou não configurado.

**Solução**:

```bash
# GitHub Actions
# Verifique se SONAR_TOKEN está em Settings → Secrets

# Local
# Verifique se o token está correto
sonar-scanner -Dsonar.token=SEU_TOKEN
```

### Erro: "Project key not found"

**Problema**: `sonar.projectKey` incorreto.

**Solução**:

1. Acesse SonarCloud dashboard
2. Copie o Project Key exato
3. Atualize `sonar-project.properties`

### Pipeline Lento

**Problema**: GitHub Actions demora muito.

**Soluções**:

-   Use `npm ci` em vez de `npm install` (já configurado)
-   Cache node_modules (já configurado)
-   Reduza `fetch-depth` no checkout (já é 0 para melhor análise)
-   Execute análise apenas na `main` (edite o workflow)

---

## 📚 Recursos Adicionais

-   [SonarCloud Documentation](https://docs.sonarcloud.io/)
-   [SonarQube Rules](https://rules.sonarsource.com/typescript/)
-   [TypeScript Best Practices](https://docs.sonarqube.org/latest/analysis/languages/typescript/)
-   [GitHub Actions Integration](https://github.com/SonarSource/sonarcloud-github-action)

---

## 🎯 Próximos Passos

1. ✅ Push do código para disparar o primeiro scan
2. ✅ Revisar issues no dashboard do SonarCloud
3. ✅ Ajustar quality gate se necessário
4. ✅ Configurar notificações (email/Slack)
5. ✅ Integrar badge no README.md

### Badge para README

Adicione ao `README.md`:

```markdown
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=seu-project-key&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=seu-project-key)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=seu-project-key&metric=coverage)](https://sonarcloud.io/summary/new_code?id=seu-project-key)
```

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique este guia de troubleshooting
2. Consulte os logs do GitHub Actions
3. Revise a documentação do SonarCloud
4. Abra uma [issue no GitHub](https://github.com/gabrieldnsilva/myMemorableAnimes/issues)
