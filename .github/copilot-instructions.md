# myMemorableAnimes Copilot Instructions

AI agents working on this codebase should understand both the v1.0 frontend and v2.0 full-stack architecture.

---

## Architecture Overview

**v2.0** is a **full-stack MVC application** with Node.js + Express + TypeScript + Sequelize (SQLite) + JWT authentication + EJS templates. The v1.0 vanilla JS frontend is being migrated to server-rendered EJS views.

### Directory Structure

```
src/
├── server.ts              # Express entry point
├── config/                # Database, environment config
├── controllers/           # Route handlers (business logic)
├── models/                # Sequelize models (User, Anime, UserAnimeList)
├── routes/                # Express route definitions
├── middlewares/           # Auth JWT, validators, error handlers
├── services/              # Reusable business logic
├── views/                 # EJS templates (future: partials)
├── css/, js/, data/       # v1.0 frontend assets (being migrated)
public/                    # Static files served by Express
database/                  # SQLite database file (*.db)
tests/                     # Jest unit/integration tests
```

---

## Key Technologies

**Backend (TypeScript strict mode, ES2020)**:

-   Express 4.18 (REST API, EJS rendering)
-   Sequelize 6.35 ORM + SQLite3 5.1.7 (NO raw SQL allowed)
-   JWT 9.0 + bcrypt 5.1 (10 rounds) for auth
-   Helmet 7.1, CORS 2.8 (security)
-   express-validator 7.0 (validation)

**Frontend (v1.0 legacy, being migrated)**:

-   Vanilla JS, Materialize CSS 1.0, jQuery 3.7.1, RemixIcon
-   `src/js/main.js` initializes carousel/modals
-   `src/data/animeData.js` is the local anime database (will migrate to Sequelize models)

**Testing**: Jest 29.7 + Supertest 6.3 (>70% coverage required)
**External API**: Jikan API v4 (MyAnimeList data) via axios 1.6

---

## Development Workflow

### Running the Project

```bash
# Install dependencies (first time)
npm install

# Development (hot-reload with ts-node-dev)
npm run dev  # Runs on http://localhost:3000

# Production build
npm run build && npm start

# Tests with coverage
npm test
```

### Creating New Features

1. **Branch naming**: `feature/<feature-name>` (e.g., `feature/auth-system`)
2. **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat: add user registration endpoint`)
3. **Models**: Use Sequelize with TypeScript. Example:

    ```typescript
    // src/models/User.ts
    import { Model, DataTypes } from "sequelize";
    import sequelize from "../config/database";

    class User extends Model {
    	public id!: number;
    	public email!: string;
    	public password!: string;
    }

    User.init(
    	{
    		email: { type: DataTypes.STRING, unique: true, allowNull: false },
    		password: { type: DataTypes.STRING, allowNull: false },
    	},
    	{ sequelize, modelName: "User" }
    );
    ```

4. **Controllers**: Async/await with try-catch, call services for logic:

    ```typescript
    // src/controllers/AuthController.ts
    export const register = async (req: Request, res: Response) => {
    	try {
    		const user = await AuthService.createUser(req.body);
    		res.status(201).json({ success: true, user });
    	} catch (error) {
    		res.status(400).json({ success: false, error: error.message });
    	}
    };
    ```

5. **Routes**: Define in `src/routes/`, apply validators and middlewares:

    ```typescript
    // src/routes/authRoutes.ts
    import { Router } from "express";
    import { register, login } from "../controllers/AuthController";
    import { authValidator } from "../middlewares/validators/authValidator";

    const router = Router();
    router.post("/register", authValidator.register, register);
    router.post("/login", authValidator.login, login);
    ```

6. **Tests**: Use Supertest for API tests, mock services:

    ```typescript
    // tests/auth.test.ts
    import request from "supertest";
    import app from "../src/server";

    describe("POST /api/auth/register", () => {
    	it("should register a new user", async () => {
    		const res = await request(app)
    			.post("/api/auth/register")
    			.send({ email: "test@example.com", password: "Test123!" });
    		expect(res.status).toBe(201);
    	});
    });
    ```

---

## Code Conventions

-   **TypeScript**: Strict mode enabled. Avoid `any`, use proper types.
-   **Async**: Always use `async/await`, never callbacks or raw promises.
-   **SQL**: NEVER write raw SQL queries. Use Sequelize ORM methods only.
-   **Auth**: JWT tokens in `Authorization: Bearer <token>` header. Middleware: `src/middlewares/authMiddleware.ts`.
-   **Error Handling**: Use `try-catch` in controllers, return `{ success: false, error: string }` on failure.
-   **Validation**: Use `express-validator` for all user inputs.
-   **Security**: Passwords hashed with bcrypt (10 rounds), JWT secret in `.env`.

---

## Current Status (as of Dec 3, 2025)

**✅ Completed Features**:

-   Feature 1: Backend Setup (MVC structure, Express, TypeScript, Sequelize)
-   Feature 2: Authentication System (JWT, bcrypt, register/login/profile)
-   Feature 3: User Profile (update profile, change password, delete account, stats)
-   Feature 4: Anime List CRUD (add/remove/update animes, favorites, ratings)
-   Feature 5: External API Integration (Jikan/MyAnimeList - search, details, top, recommendations, random)

**📊 Test Coverage**: 90.39% statements, 64.67% branches, 94.73% functions (110 tests passing)

**🔄 Next**: Feature 6 - EJS Views Migration

Refer to `NEXT_STEPS.md` for detailed roadmap and `docs/BACKEND_SETUP.md` for architecture details.

---

## v1.0 Frontend (Legacy - Being Migrated)

The original static site used:

-   `public/index.html` as the entry point with Materialize carousel
-   `src/data/animeData.js` as a local JSON-like database
-   `src/js/modules/carousel.js`, `auth.js`, `form.js` for UI logic

When migrating to EJS:

-   Convert HTML sections to partials in `src/views/partials/`
-   Replace `animeData.js` with Sequelize `Anime` model queries
-   Keep `src/css/` styles, update paths for Express static serving
