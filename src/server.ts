import express, { Application, Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { testConnection, syncDatabase } from "./config/database";
import authRoutes from "./routes/authRoutes";
import profileRoutes from "./routes/profileRoutes";

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

// Configuração do EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Variável para controlar se o banco foi inicializado
let dbInitialized = false;

// Middleware para garantir que o banco esteja pronto
app.use(async (_req, res, next) => {
	if (!dbInitialized) {
		try {
			await testConnection();
			await syncDatabase();
			dbInitialized = true;
		} catch (error) {
			res.status(500).json({
				error: "Database initialization failed",
			});
			return;
		}
	}
	next();
});

// Servir arquivos estáticos (CSS, JS, imagens)
app.use(express.static(path.join(__dirname, "../public")));
app.use("/src/assets", express.static(path.join(__dirname, "../src/assets")));

// Rotas de autenticação
app.use("/api/auth", authRoutes);

// Rotas de perfil
app.use("/api/profile", profileRoutes);

// Rota de teste (placeholder)
app.get("/", (_req: Request, res: Response) => {
	res.json({
		message: "myMemorableAnimes API v2.0",
		status: "running",
		timestamp: new Date().toISOString(),
	});
});

// Rota de health check
app.get("/health", (_req: Request, res: Response) => {
	res.status(200).json({ status: "OK", uptime: process.uptime() });
});

// Middleware de erro 404
app.use((req: Request, res: Response) => {
	res.status(404).json({
		error: "Not Found",
		message: `Route ${req.originalUrl} not found`,
	});
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
