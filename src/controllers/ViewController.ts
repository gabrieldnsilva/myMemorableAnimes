import { Request, Response, NextFunction } from "express";
import AnimeService from "../services/AnimeService";
import UserAnimeList, { WatchStatus } from "../models/UserAnimeList";
import ProfileService from "../services/ProfileService";
import AuthService from "../services/AuthService";
import { AuthenticatedRequest } from "../types/auth";

export class ViewController {
	// Home page - Carrossel de animes
	static async home(_req: Request, res: Response): Promise<void> {
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
		if (req.session?.user) {
			return res.redirect("/");
		}

		res.render("pages/login", {
			title: "Login - myMemorableAnimes",
		});
	}

	// Register page
	static registerPage(req: Request, res: Response): void {
		if (req.session?.user) {
			return res.redirect("/");
		}

		res.render("pages/register", {
			title: "Cadastro - myMemorableAnimes",
		});
	}

	// Profile page (protected)
	static async profilePage(
		req: AuthenticatedRequest,
		res: Response
	): Promise<void> {
		try {
			const userId = req.user?.id;
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

	// Update profile data (session-based)
	static async profileUpdate(
		req: AuthenticatedRequest,
		res: Response
	): Promise<void> {
		try {
			const userId = req.user?.id;
			if (!userId) {
				req.flash("error", "Você precisa estar logado");
				return res.redirect("/login");
			}

			const { name, email, bio } = req.body;
			await ProfileService.updateUserData(userId, { name, email, bio });

			// Keep session in sync
			req.session.user = {
				id: req.session.user!.id,
				email,
				name,
			};

			req.flash("success", "Perfil atualizado com sucesso");
			res.redirect("/profile");
		} catch (error) {
			req.flash(
				"error",
				error instanceof Error
					? error.message
					: "Erro ao atualizar perfil"
			);
			res.redirect("/profile");
		}
	}

	// Update password (session-based)
	static async profilePasswordUpdate(
		req: AuthenticatedRequest,
		res: Response
	): Promise<void> {
		try {
			const userId = req.user?.id;
			if (!userId) {
				req.flash("error", "Você precisa estar logado");
				return res.redirect("/login");
			}

			const { oldPassword, newPassword } = req.body;
			await ProfileService.changePassword(userId, {
				oldPassword,
				newPassword,
			});

			req.flash("success", "Senha atualizada com sucesso");
			res.redirect("/profile");
		} catch (error) {
			req.flash(
				"error",
				error instanceof Error ? error.message : "Erro ao alterar senha"
			);
			res.redirect("/profile");
		}
	}

	// Delete account (session-based)
	static async profileDelete(
		req: AuthenticatedRequest,
		res: Response
	): Promise<void> {
		try {
			const userId = req.user?.id;
			if (!userId) {
				req.flash("error", "Você precisa estar logado");
				return res.redirect("/login");
			}

			await ProfileService.deactivateAccount(userId);
			req.session.destroy(() => {
				res.redirect("/");
			});
		} catch (error) {
			req.flash(
				"error",
				error instanceof Error ? error.message : "Erro ao excluir conta"
			);
			res.redirect("/profile");
		}
	}

	// Anime list page (protected)
	static async animeListPage(
		req: AuthenticatedRequest,
		res: Response
	): Promise<void> {
		try {
			const userId = req.user?.id;
			if (!userId) {
				return res.redirect("/login");
			}

			const status = req.query.status as WatchStatus | undefined;
			const favorite =
				req.query.favorite === "true"
					? true
					: req.query.favorite === "false"
					? false
					: undefined;
			const sortBy =
				(req.query.sortBy as "title" | "addedAt" | "rating") ||
				"addedAt";
			const sortOrder = (req.query.sortOrder as "ASC" | "DESC") || "DESC";
			const page = parseInt(req.query.page as string) || 1;
			const limit = parseInt(req.query.limit as string) || 12;

			const { entries, pagination } =
				(await AnimeService.getUserAnimeList(userId, {
					status,
					favorite,
					sortBy,
					sortOrder,
					page,
					limit,
					withPagination: true,
				})) as unknown as {
					entries: UserAnimeList[];
					pagination: {
						total: number;
						page: number;
						limit: number;
						totalPages: number;
					};
				};

			res.render("pages/animeList", {
				title: "Minha Lista - myMemorableAnimes",
				animes: entries,
				pagination,
				filters: { status, favorite, sortBy, sortOrder, limit },
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
	static searchPage(_req: Request, res: Response): void {
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
			res.redirect("/");
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

			// Save session before redirecting
			req.session.save((err) => {
				if (err) {
					req.flash("error", "Erro ao salvar sessão");
					return res.redirect("/login");
				}
				req.flash("success", `Bem-vindo, ${user.name}!`);
				res.redirect("/");
			});
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

			// Save session before redirecting
			req.session.save((err) => {
				if (err) {
					req.flash("error", "Erro ao salvar sessão");
					return res.redirect("/register");
				}
				req.flash(
					"success",
					`Conta criada com sucesso! Bem-vindo, ${user.name}!`
				);
				res.redirect("/");
			});
		} catch (error) {
			req.flash(
				"error",
				error instanceof Error ? error.message : "Erro ao criar conta"
			);
			res.redirect("/register");
		}
	}

	// 404 Not Found
	static notFound(_req: Request, res: Response): void {
		res.status(404).render("errors/404", {
			title: "404 - Página não encontrada",
		});
	}

	// 500 Internal Server Error
	static serverError(
		err: Error,
		_req: Request,
		res: Response,
		_next: NextFunction
	): void {
		console.error("Server error:", err);
		res.status(500).render("errors/500", {
			title: "500 - Erro no servidor",
		});
	}
}
