# myMemorableAnimes

![Hero image](/docs/images/hero-myAnimes.jpg)

Um catálogo de animes simples e bonito, feito com HTML, CSS e JavaScript vanilla. O objetivo é apresentar títulos, sinopses e uma experiência interativa com carrossel, modais para login e contato, priorizando performance, acessibilidade e design temático (anime).

Repositório: [https://github.com/gabrieldnsilva/myMemorableAnimes](https://github.com/gabrieldnsilva/myMemorableAnimes)

## Demonstração

Rode localmente (ver seção "Como rodar") e abra `http://localhost:8000/public/`.

## Principais features

- SPA estático (vanilla JS) com renderização dinâmica do conteúdo a partir de `src/data/animeData.js`.
- Carrossel de animes com background dinâmico e navegação por teclado.
- Modais: login e formulário de contato (com validação básica e máscara de CPF).
- Design responsivo com `src/css/base.css` e `src/css/responsive.css`.
- Integração com Materialize CSS, jQuery e RemixIcon via CDN.
- Notificações com SweetAlert2 (opcional, via CDN).
- Foco em acessibilidade: atalhos de teclado, atributos ARIA, `skip-link` e melhorias no DOM para leitores de tela.

## Estrutura do projeto

- `public/` – ponto de entrada da aplicação (arquivo `index.html`).

  Use este diretório para servir a aplicação (ex.: `python -m http.server --directory public 8000`).

- `src/`

  - `assets/` – imagens, ícones (posters, backgrounds, titles).
  - `css/` – `base.css`, `responsive.css` (estilos principais).
  - `data/animeData.js` – "banco" local com objetos de animes exibidos.
  - `js/`

    - `main.js` – inicialização e orquestração da aplicação.
    - `modules/` – módulos pequenos e reutilizáveis: `carousel.js`, `auth.js`, `form.js`.

## Como rodar localmente

Recomendado apenas para desenvolvimento local (não é necessário build):

```bash
# Serve a pasta public na porta 8000
python -m http.server --directory public 8000
```

Abra no navegador em `http://localhost:8000/public/`.

Alternativas: usar Live Server (VSCode) ou `npx http-server ./public -p 8000`.

## Dependências (CDN)

- Materialize CSS (1.0.0) – componentes (modals, carousel, sidenav).
- jQuery – dependência do Materialize.
- RemixIcon – ícones.
- SweetAlert2 – alertas e confirmações (opcional).

Essas bibliotecas são carregadas por CDN em `public/index.html` para manter o repositório simples.

## Como adicionar um novo anime

1. Coloque as imagens necessárias em `src/assets/images/posters/` (poster), `src/assets/images/titles/` (title) e `src/assets/images/backgrounds/` (background).

1. No `public/index.html`, adicione um novo elemento `.carousel-item` com o atributo `data-animekey="<chaveUnica>"` e a `img` do poster:

```html
<div class="carousel-item" data-animekey="novoAnime" role="listitem">
  <img src="/src/assets/images/posters/novo-anime-poster.webp" alt="Novo Anime Poster" />
</div>
```

1. No `src/data/animeData.js`, adicione a entrada correspondente com a mesma chave `novoAnime`:

```javascript
export const animesData = {
  // ...existing entries
  novoAnime: {
    titleImage: "/src/assets/images/titles/novo-anime-title.webp",
    year: "2025",
    rating: "12+",
    duration: "1h 48m",
    genre: "Shōnen",
    synopsis: "Uma sinopse curta aqui...",
    background: "novo-anime-background.webp",
  },
};
```

1. Salve e recarregue a página. O `main.js` detecta o `data-animekey` via listener do carrossel e exibirá o conteúdo dinamicamente.

## Acessibilidade e design

- `skip-link` para pular ao conteúdo principal está implementado (`public/index.html`).
- ARIA: modais e carrossel possuem atributos ARIA; indicadores e overlays foram reforçados no JS.
- Keyboard: carousel responde às setas e elementos focáveis possuem `tabindex` quando necessário.
- Se estiver adicionando imagens ao README, use `alt` e, quando relevante, legendas em português.

## Telas e Demonstrações

### Demonstração do projeto
![Demonstração do projeto](/docs/images/gif/demo-myAnimes.gif)

### Conteúdo dinâmico
![Conteúdo dinâmico](/docs/images/anime-content.png)

### Carrossel de animes
![Carrossel de animes](/docs/images/carousel-items.png)

### Modal de login
![Modal de login](/docs/images/login-modal.png)

### Modal de contato
![Modal de contato](/docs/images/contact-modal.png)

## Problemas conhecidos e notas técnicas

- O projeto é carregado por CDNs para simplicidade; para produção, considere pinning de versões ou bundling.
- Modais e sidenav do Materialize criam overlays dinâmicos. Se você tiver problemas de `z-index` (links não clicáveis no mobile), verifique `src/css/base.css` e se `#mobile-nav` é filho direto de `body` (o `main.js` já tem um trecho que move `#mobile-nav` para `document.body`).

## Como contribuir

1. Fork este repositório.
2. Crie uma branch com o nome `feature/descrição`.
3. Faça seus commits e abra um Pull Request.
