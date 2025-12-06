# myMemorableAnimes Copilot Instructions

**Status**: v2.0 full-stack MVC with server-rendered EJS (Phase 3 authentication complete, 96.4% tests passing)

---

## Architecture & Critical Patterns

**Core Stack**: Express + TypeScript + EJS (server-rendered) + Sequelize ORM (SQLite) + Session-based auth + TailwindCSS + Alpine.js

**Key Architectural Decision**: This is **server-rendered** (NOT API-first). Page views include complete HTML with `<!DOCTYPE>`, `<head>`, and CSS/JS links—never render partial content as standalone pages.

### View Rendering Pattern

Each page in `src/views/pages/` must include:

1. Full HTML5 structure with `<head>` containing `/css/output.css`, Alpine.js CDN, HTMX CDN
2. Include `<%- include('../partials/header') %>` and `<%- include('../partials/flashMessages') %>`
3. Body: `<body class="bg-black text-white min-h-screen flex flex-col font-sans">`

**Example** (`src/views/pages/login.ejs`): [Has correct structure with head/fonts/CSS/Alpine]

### Session & User Context

-   Session middleware: 7-day httpOnly cookies, `req.session?.user = {id, email, name, ...}`
-   **Middleware order in server.ts**: session → flash → user locals → EJS config
-   `res.locals.user` available in ALL templates (set by inline middleware, NOT viewLocals.ts)
-   Protected routes: use `requireAuth` middleware from `src/middlewares/authMiddleware.ts`

---

## Code Conventions & Patterns

**TypeScript & Async**:

-   Strict mode enabled; no `any` types. Use proper interfaces (e.g., `AuthenticatedRequest extends Request`)
-   Always `async/await`. Controllers use `try-catch` and return `{ success: false, error: string }`

**Database**:

-   Sequelize ONLY—NO raw SQL. Models in `src/models/` with TypeScript: `User.init({...}, {sequelize, modelName: "User"})`
-   Example: `const user = await User.findByPk(id)` or `await User.create({email, password})`

**Authentication** (Session-based, NOT JWT):

-   Login/register routes in `src/routes/viewRoutes` use `POST` with form data, then `req.session.save()` before redirect
-   Format: `req.session.user = {id, email, name}` (store full user object, not just ID)
-   Protected views use `requireAuth` middleware (checks `req.session?.user`)
-   Flash messages via `connect-flash`: `req.flash("success", "message")`; auto-dismiss in templates with Alpine

**Controllers & Services**:

-   Controllers (`src/controllers/`) call services (`src/services/`) for business logic—keep controllers thin
-   Example: `AuthService.validateCredentials({email, password})` returns User or throws error
-   Services handle validation, bcrypt, Sequelize queries

**Styling** (TailwindCSS v3.4.18):

-   Dark theme: `bg-black text-white` + glassmorphism (e.g., `bg-gray-800/50 backdrop-blur-xl`)
-   Colors: `text-accent-500` (orange), `bg-blue-600` (interactive), gradients like `bg-gradient-to-br from-gray-900 via-black to-gray-900`
-   Responsive: `hidden md:flex`, `md:text-3xl`, etc.
-   Recompile CSS: `npm run dev:css` watches `src/styles/input.css` → `public/css/output.css`

**Views & Partials**:

-   Partials in `src/views/partials/`: `header.ejs`, `flashMessages.ejs`, `searchResults.ejs`, `htmx/error.ejs`
-   Include syntax: `<%- include('../partials/header') %>` (use `<%- ... %>` not `<%= ... %>`)
-   EJS conditionals: `<% if (user) { %>` + `</ %>` for logic; `<%= var %>` for output

**Validation**:

-   Use `express-validator` in route definitions: `router.post("/register", authValidator.register, registerSubmit)`
-   Validators in `src/middlewares/validators/`: import and chain `.isEmail().normalizeEmail()` etc.

---

## Development Workflow

```bash
# Start dev (all concurrently: CSS watch + TS hot-reload + seeding)
npm run dev

# Run tests with coverage (target: 70% global threshold)
npm test

# Watch tests during development
npm run test:watch

# Lint TypeScript
npm run lint:fix
```

**Key Files**:

-   `src/server.ts`: Express setup (session, flash, viewLocals, routes)
-   `src/routes/viewRoutes.ts`: View page routes (use ViewController methods)
-   `src/controllers/ViewController.ts`: `home()`, `loginPage()`, `registerPage()`, etc. (renders pages, NOT JSON)
-   `src/config/database.ts`: Sequelize connection & sync
-   `tailwind.config.js`: Scans `src/views/**/*.ejs` for CSS generation
-   `jest.config.js`: Coverage threshold 70% global (branches: 63%, functions/lines/statements: 70%)

---

## Common Gotchas & Solutions

1. **Pages render blank**: Verify page has full HTML structure with `<link rel="stylesheet" href="/css/output.css">` and Alpine/HTMX CDN links
2. **User data not in header**: Check `req.session.user` is set AFTER login (use `req.session.save(cb)` before redirect)
3. **CSS not applying**: Run `npm run dev:css` and confirm `/public/css/output.css` exists; clear browser cache
4. **Tests failing**: Check database is clean (jest teardown drops tables); use maxWorkers: 1 in jest.config.js
5. **Route not rendering**: Verify middleware order in server.ts (session → flash → locals → EJS → routes)

---

## Testing Strategy

-   **Jest** with `ts-jest` preset, `supertest` for HTTP tests
-   Test file pattern: `tests/*.test.ts` (e.g., `viewController.test.ts`)
-   Setup/teardown: `src/config/database.sync()` before, `dropAllTables()` after
-   Mock services where needed; prefer testing real database in integration tests
-   Target: >70% coverage globally (focus on controllers, services, routes first)

---

## Current Status (as of Dec 5, 2025)

**✅ Phase 3 Authentication (100% Complete)**:

-   Session-based login/register with form submission
-   User context (`req.session.user`) available in all templates
-   Header shows personalized greeting: "Olá, [name]!" when authenticated
-   Flash messages with 4-second auto-dismiss via Alpine.js
-   Protected routes using `requireAuth` middleware
-   All 18 ViewController tests passing (100%)

**📊 Test Coverage**: 60.59% statements, 28.89% branches (target: 70% global)

-   ViewController: 54.65% coverage (18 tests for auth flows)
-   AuthController: 91.11% coverage
-   ProfileService: 87.03% coverage
-   Gap areas: AnimeController (14.97%), AnimeService (18.84%)

**🎨 Frontend Architecture** (Server-rendered with EJS):

-   All pages in `src/views/pages/` have complete HTML structure (no partials-only files)
-   Styling: TailwindCSS v3.4.18 with dark theme (`bg-black text-white`)
-   Interactivity: Alpine.js v3 for reactive components + HTMX v1.9.10 for AJAX forms
-   Responsive: Mobile-first design with `md:` breakpoints
-   CSS compiled from `src/styles/input.css` → `public/css/output.css` (watched during dev)

**🔄 Next Steps**:

1. Increase test coverage to 70% global (add tests for AnimeController, AnimeService)
2. Migrate remaining v1.0 views to EJS full-page templates
3. Implement HTMX integration for anime list CRUD operations
4. Add SonarQube quality checks to CI/CD

---

## Directory Structure

```
src/
├── server.ts                          # Express setup (middleware order critical)
├── config/
│   └── database.ts                    # Sequelize connection & sync
├── controllers/
│   ├── ViewController.ts              # Page renders (home, login, register, etc.)
│   ├── AuthController.ts              # API endpoints (for future JSON responses)
│   ├── AnimeController.ts             # Anime CRUD API
│   ├── ProfileController.ts           # User profile API
│   └── ExternalApiController.ts       # Jikan API proxy
├── models/
│   ├── User.ts                        # Sequelize User model
│   ├── Anime.ts                       # Sequelize Anime model
│   └── UserAnimeList.ts               # User's anime list entries
├── services/
│   ├── AuthService.ts                 # Validation, password hashing
│   ├── AnimeService.ts                # Anime queries
│   ├── ProfileService.ts              # User profile operations
│   └── JikanService.ts                # MyAnimeList API integration
├── routes/
│   ├── viewRoutes.ts                  # EJS page routes (GET /login, POST /login)
│   ├── authRoutes.ts                  # API routes (/api/auth/*)
│   ├── animeRoutes.ts                 # API routes (/api/animes/*)
│   ├── profileRoutes.ts               # API routes (/api/profile/*)
│   └── externalApiRoutes.ts           # API routes (/api/external/*)
├── middlewares/
│   ├── authMiddleware.ts              # JWT verification + session auth
│   ├── viewLocals.ts                  # Passes user/flash to views (UNUSED - inline in server.ts)
│   └── validators/                    # express-validator chains
├── views/
│   ├── pages/                         # Full-page templates (home, login, register, etc.)
│   ├── partials/                      # Reusable components (header, flashMessages, etc.)
│   ├── layouts/                       # Layout templates (NOT currently used)
│   └── errors/                        # Error pages (404, 500)
├── styles/
│   └── input.css                      # TailwindCSS directives + custom utilities
└── types/
    ├── auth.ts                        # AuthenticatedRequest interface
    └── session.ts                     # Session type declarations

public/
├── css/
│   └── output.css                     # Compiled TailwindCSS (generated, don't edit)
└── images/
    ├── backgrounds/                   # Anime background images
    ├── icons/                         # App icons
    ├── posters/                       # Anime poster images
    └── titles/                        # Anime title images

tests/
├── viewController.test.ts             # 18 tests for page rendering + auth flows
├── auth.test.ts                       # API endpoint tests
├── anime.test.ts                      # Anime CRUD tests
├── profile.test.ts                    # Profile operations tests
├── externalApi.test.ts                # Jikan API integration tests
├── setup.ts                           # Jest setup (database init)
└── teardown.ts                        # Jest teardown (database cleanup)
```

---

## Critical Implementation Details

### Creating a New EJS Page

```ejs
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><%= title %></title>

    <!-- Font -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet" />

    <!-- CSS (REQUIRED) -->
    <link rel="stylesheet" href="/css/output.css" />

    <!-- Alpine.js (REQUIRED for reactivity) -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

    <!-- HTMX (for AJAX forms) -->
    <script src="https://unpkg.com/htmx.org@1.9.10"></script>
  </head>
  <body class="bg-black text-white min-h-screen flex flex-col font-sans">
    <%- include('../partials/header') %>
    <%- include('../partials/flashMessages') %>

    <main class="flex-grow">
      <!-- Your content here -->
    </main>
  </body>
</html>
```

### Session Management in Routes

```typescript
// src/routes/viewRoutes.ts
import { ViewController } from "../controllers/ViewController";
import { authenticateSession } from "../middlewares/authMiddleware";

router.post("/login", async (req, res) => {
	const user = await AuthService.validateCredentials(req.body);
	req.session.user = { id: user.id, email: user.email, name: user.name };
	req.session.save((err) => {
		// CRITICAL: Save before redirect
		if (err) return res.status(500).send("Login failed");
		res.redirect("/");
	});
});

// Protected route
router.get("/profile", authenticateSession, ViewController.profilePage);
```

### Using Flash Messages in Templates

```ejs
<!-- In any view, flash messages are auto-included via partials/flashMessages -->
<%- include('../partials/flashMessages') %>

<!-- In controller before redirect -->
req.flash("success", "Anime adicionado à sua lista!");
res.redirect("/animes");

<!-- Result: Green success banner auto-dismisses after 4 seconds -->
```

### HTMX + Alpine Integration Pattern

```ejs
<!-- Search form with HTMX -->
<form hx-get="/api/external/search" hx-target="#results" hx-indicator=".loading">
  <input type="text" name="q" />
  <button type="submit">Buscar</button>
  <span class="loading htmx-indicator">Carregando...</span>
</form>
<div id="results"></div>

<!-- Alpine for client-side state -->
<div x-data="{ count: 0 }">
  <button @click="count++">Incrementar</button>
  <span x-text="count"></span>
</div>
```

---

## Key Middleware Order (Critical!)

In `src/server.ts`, this order is ESSENTIAL:

```typescript
app.use(session(...));              // 1. Session must come first
app.use(flash());                   // 2. Flash depends on session
app.use((req, res, next) => {       // 3. Set locals for ALL routes
  res.locals.user = req.session?.user || null;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});
app.set("view engine", "ejs");      // 4. Then EJS config
app.use(viewRoutes);                // 5. Then routes (order matters: views before APIs)
app.use("/api/auth", authRoutes);
```

---

## Environment Variables (.env)

```
PORT=3000
NODE_ENV=development
SESSION_SECRET=change-this-in-production
DATABASE_URL=./database/database.db
JIKAN_API_BASE=https://api.jikan.moe/v4
```
