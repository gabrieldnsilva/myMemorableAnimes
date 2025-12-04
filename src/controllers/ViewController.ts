import { Request, Response, NextFunction } from "express";
import AnimeService from "../services/AnimeService";
import ProfileService from "../services/ProfileService";
import AuthService from "../services/AuthService";

export class ViewController {
	// Home page - Carrossel de animes
	static async home(req: Request, res: Response): Promise<void> {
		try {
			const result = await AnimeService.getAllAnimes({ limit: 10 });

			res.render("pages/home", {
				title: "Início - myMemorableAnimes",
				animes: result.animes,
			});
		} catch (error) {
			console.error("Error rendering home:", error);
			res.status(500).render("errors/500", {
				title: "Erro - myMemorableAnimes",
			});
		}
	}

	// Login page
	static loginPage(req: Request, res: Response): void {
		if (req.session?.userId) {
			return res.redirect("/");
		}

		res.render("pages/login", {
			title: "Login - myMemorableAnimes",
		});
	}

	// Register page
	static registerPage(req: Request, res: Response): void {
		if (req.session?.userId) {
			return res.redirect("/");
		}

		res.render("pages/register", {
			title: "Cadastro - myMemorableAnimes",
		});
	}

	// Profile page (protected)
	static async profilePage(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.session?.userId;
			if (!userId) {
				return res.redirect("/login");
			}

			const profile = await ProfileService.getFullProfile(userId);

			res.render("pages/profile", {
				title: "Meu Perfil - myMemorableAnimes",
				profile,
			});
		} catch (error) {
			console.error("Error rendering profile:", error);
			req.flash("error", "Erro ao carregar perfil");
			res.redirect("/");
		}
	}

	// Anime list page (protected)
	static async animeListPage(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.session?.userId;
			if (!userId) {
				return res.redirect("/login");
			}

			const animes = await AnimeService.getUserAnimeList(userId);

			res.render("pages/animeList", {
				title: "Minha Lista - myMemorableAnimes",
				animes,
			});
		} catch (error) {
			console.error("Error rendering anime list:", error);
			req.flash("error", "Erro ao carregar lista");
			res.redirect("/");
		}
	}

	// Anime details page
	static async animeDetailsPage(req: Request, res: Response): Promise<void> {
		try {
			const animeId = parseInt(req.params.id);
			if (isNaN(animeId)) {
				req.flash("error", "ID de anime inválido");
				return res.redirect("/");
			}

			const anime = await AnimeService.getAnimeById(animeId);

			if (!anime) {
				req.flash("error", "Anime não encontrado");
				return res.redirect("/");
			}

			res.render("pages/animeDetails", {
				title: `${anime.title} - myMemorableAnimes`,
				anime,
			});
		} catch (error) {
			console.error("Error rendering anime details:", error);
			req.flash("error", "Erro ao carregar detalhes do anime");
			res.redirect("/");
		}
	}

	// Search page
	static searchPage(req: Request, res: Response): void {
		res.render("pages/search", {
			title: "Buscar Animes - myMemorableAnimes",
		});
	}

	// Logout
	static logout(req: Request, res: Response): void {
		req.session?.destroy((err) => {
			if (err) {
				console.error("Error destroying session:", err);
				req.flash("error", "Erro ao fazer logout");
				return res.redirect("/");
			}
			res.redirect("/login");
		});
	}

	// Handle login form submission (session-based)
	static async loginSubmit(req: Request, res: Response): Promise<void> {
		try {
			const { email, password } = req.body;

			if (!email || !password) {
				req.flash("error", "Email e senha são obrigatórios");
				return res.redirect("/login");
			}

			// Validate credentials
			const user = await AuthService.validateCredentials({
				email,
				password,
			});

			// Store user in session
			req.session.user = {
				id: user.id,
				email: user.email,
				name: user.name,
			};

			req.flash("success", `Bem-vindo, ${user.name}!`);
			res.redirect("/");
		} catch (error) {
			req.flash(
				"error",
				error instanceof Error ? error.message : "Erro ao fazer login"
			);
			res.redirect("/login");
		}
	}

	// Handle register form submission (session-based)
	static async registerSubmit(req: Request, res: Response): Promise<void> {
		try {
			const { name, email, password } = req.body;

			if (!name || !email || !password) {
				req.flash("error", "Todos os campos são obrigatórios");
				return res.redirect("/register");
			}

			// Create user
			const user = await AuthService.createUser({
				name,
				email,
				password,
			});

			// Store user in session
			req.session.user = {
				id: user.id,
				email: user.email,
				name: user.name,
			};

			req.flash(
				"success",
				`Conta criada com sucesso! Bem-vindo, ${user.name}!`
			);
			res.redirect("/");
		} catch (error) {
			req.flash(
				"error",
				error instanceof Error ? error.message : "Erro ao criar conta"
			);
			res.redirect("/register");
		}
	}

	// 404 Not Found
	static notFound(req: Request, res: Response): void {
		res.status(404).render("errors/404", {
			title: "404 - Página não encontrada",
		});
	}

	// 500 Internal Server Error
	static serverError(
		err: Error,
		req: Request,
		res: Response,
		_next: NextFunction
	): void {
		console.error("Server error:", err);
		res.status(500).render("errors/500", {
			title: "500 - Erro no servidor",
		});
	}
}
