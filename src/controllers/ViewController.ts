import { Request, Response, NextFunction } from 'express';
import AnimeService from '../services/AnimeService';
import ProfileService from '../services/ProfileService';

export class ViewController {
	// Home page - Carrossel de animes
	static async home(req: Request, res: Response): Promise<void> {
		try {
			const result = await AnimeService.getAllAnimes({ limit: 10 });

			res.render('pages/home', {
				title: 'Início - myMemorableAnimes',
				animes: result.animes,
			});
		} catch (error) {
			console.error('Error rendering home:', error);
			res.status(500).render('errors/500', {
				title: 'Erro - myMemorableAnimes',
			});
		}
	}

	// Login page
	static loginPage(req: Request, res: Response): void {
		if (req.session?.userId) {
			return res.redirect('/');
		}

		res.render('pages/login', {
			title: 'Login - myMemorableAnimes',
		});
	}

	// Register page
	static registerPage(req: Request, res: Response): void {
		if (req.session?.userId) {
			return res.redirect('/');
		}

		res.render('pages/register', {
			title: 'Cadastro - myMemorableAnimes',
		});
	}

	// Profile page (protected)
	static async profilePage(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.session?.userId;
			if (!userId) {
				return res.redirect('/login');
			}

			const profile = await ProfileService.getFullProfile(userId);

			res.render('pages/profile', {
				title: 'Meu Perfil - myMemorableAnimes',
				profile,
			});
		} catch (error) {
			console.error('Error rendering profile:', error);
			req.flash('error', 'Erro ao carregar perfil');
			res.redirect('/');
		}
	}

	// Anime list page (protected)
	static async animeListPage(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.session?.userId;
			if (!userId) {
				return res.redirect('/login');
			}

			const animes = await AnimeService.getUserAnimeList(userId);

			res.render('pages/animeList', {
				title: 'Minha Lista - myMemorableAnimes',
				animes,
			});
		} catch (error) {
			console.error('Error rendering anime list:', error);
			req.flash('error', 'Erro ao carregar lista');
			res.redirect('/');
		}
	}

	// Search page
	static searchPage(req: Request, res: Response): void {
		res.render('pages/search', {
			title: 'Buscar Animes - myMemorableAnimes',
		});
	}

	// Logout
	static logout(req: Request, res: Response): void {
		req.session?.destroy((err) => {
			if (err) {
				console.error('Error destroying session:', err);
				req.flash('error', 'Erro ao fazer logout');
				return res.redirect('/');
			}
			res.redirect('/login');
		});
	}

	// 404 Not Found
	static notFound(req: Request, res: Response): void {
		res.status(404).render('errors/404', {
			title: '404 - Página não encontrada',
		});
	}

	// 500 Internal Server Error
	static serverError(
		err: Error,
		req: Request,
		res: Response,
		_next: NextFunction
	): void {
		console.error('Server error:', err);
		res.status(500).render('errors/500', {
			title: '500 - Erro no servidor',
		});
	}
}
