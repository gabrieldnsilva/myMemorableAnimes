import express, { Application, Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import flash from "connect-flash";
import { testConnection, syncDatabase } from "./config/database";
import authRoutes from "./routes/authRoutes";
import profileRoutes from "./routes/profileRoutes";
import animeRoutes from "./routes/animeRoutes";
import externalApiRoutes from "./routes/externalApiRoutes";
import viewRoutes from "./routes/viewRoutes";
import "./types/session";

// Configuração de variáveis de ambiente
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança
app.use(
	helmet({
		contentSecurityPolicy: false, // Desabilitar temporariamente para desenvolvimento
	})
);
app.use(cors());

// Middlewares de parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session middleware
app.use(
	session({
		secret:
			process.env.SESSION_SECRET ||
			"your-secret-key-change-in-production",
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
		},
	})
);

// Flash messages
app.use(flash());

// Middleware para passar user e flash messages para todas as views
app.use((req, res, next) => {
	res.locals.user = req.session?.user || null;
	res.locals.success = req.flash("success");
	res.locals.error = req.flash("error");
	res.locals.body = "";
	next();
});

// Configuração do EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Servir arquivos estáticos (CSS, JS, imagens)
app.use(express.static(path.join(__dirname, "../public")));
app.use("/src/assets", express.static(path.join(__dirname, "../src/assets")));

// Rotas de views EJS (devem vir antes das rotas de API)
app.use("/", viewRoutes);

// Rotas de autenticação
app.use("/api/auth", authRoutes);

// Rotas de perfil
app.use("/api/profile", profileRoutes);

// Rotas de anime
app.use("/api/animes", animeRoutes);

// Rotas de integração externa (Jikan)
app.use("/api/external", externalApiRoutes);

// Rota de health check
app.get("/health", (_req: Request, res: Response) => {
	res.status(200).json({ status: "OK", uptime: process.uptime() });
});

// Middleware de tratamento de erros global
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
	console.error("❌ Error:", err.stack);
	res.status(500).json({
		error: "Internal Server Error",
		message:
			process.env.NODE_ENV === "development"
				? err.message
				: "Something went wrong",
	});
});

// Inicialização do servidor
const startServer = async () => {
	try {
		// Testar conexão com o banco
		await testConnection();

		// Sincronizar modelos com o banco
		await syncDatabase();

		// Iniciar servidor apenas se não estivermos em modo de teste
		if (process.env.NODE_ENV !== "test") {
			app.listen(PORT, () => {
				console.log(`🚀 Server running on http://localhost:${PORT}`);
				console.log(
					`📦 Environment: ${process.env.NODE_ENV || "development"}`
				);
			});
		}
	} catch (error) {
		console.error("❌ Failed to start server:", error);
		process.exit(1);
	}
};

// Não iniciar o servidor se estivermos importando para testes
if (require.main === module) {
	startServer();
}

export default app;
