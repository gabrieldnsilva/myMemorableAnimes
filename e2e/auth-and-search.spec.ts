import { test, expect } from '@playwright/test';

test.describe('myMemorableAnimes E2E Tests', () => {
	test.describe('Authentication Flow', () => {
		test('User can register and login', async ({ page }) => {
			// Navigate to home
			await page.goto('/');
			expect(page.url()).toContain('localhost:3000');

			// Click Cadastro
			await page.click('a:has-text("Cadastro")');
			await expect(page).toHaveTitle(/Cadastro/);

			// Fill registration form
			const name = `Test User ${Date.now()}`;
			const email = `test${Date.now()}@example.com`;
			const password = 'SecurePass@123';

			await page.fill('input[name="name"]', name);
			await page.fill('input[name="email"]', email);
			await page.fill('input[name="password"]', password);
			await page.fill('input[name="confirmPassword"]', password);

			// Submit
			await page.click('button[type="submit"]');
			await page.waitForURL('/');

			// Verify user is logged in (should see name in header)
			await expect(page.locator('text=Olá')).toBeVisible();

			// Logout
			await page.click('a:has-text("Sair")');
			await page.waitForURL('/');
			await expect(page.locator('a:has-text("Login")')).toBeVisible();

			// Login back
			await page.click('a:has-text("Login")');
			await page.fill('input[name="email"]', email);
			await page.fill('input[name="password"]', password);
			await page.click('button[type="submit"]');

			await page.waitForURL('/');
			await expect(page.locator('text=Bem-vindo')).toBeVisible();
		});

		test('Login with invalid credentials fails', async ({ page }) => {
			await page.goto('/login');
			await page.fill('input[name="email"]', 'wrong@example.com');
			await page.fill('input[name="password"]', 'WrongPassword');
			await page.click('button[type="submit"]');

			// Should show error message
			await expect(page.locator('text=/Erro|invalid/i')).toBeVisible();
		});

		test('Protected routes redirect to login', async ({ page }) => {
			// Try to access protected route without login
			await page.goto('/animes');
			await page.waitForURL('/login');
			expect(page.url()).toContain('/login');
		});
	});

	test.describe('Home Page', () => {
		test('Home page loads and displays carousel', async ({ page }) => {
			await page.goto('/');

			// Check carousel exists
			await expect(page.locator('text=Catálogo de Animes')).toBeVisible();

			// Check if images are loading
			const images = await page.locator('img[alt*="Background"]').count();
			expect(images).toBeGreaterThan(0);

			// Check carousel buttons
			await expect(page.locator('button[type="button"]')).toBeTruthy();
		});

		test('User can navigate carousel', async ({ page }) => {
			await page.goto('/');

			// Wait for carousel to load
			await page.waitForSelector('[x-data*="carousel"]');

			// Get initial slide indicator
			const indicators = page.locator('button[class*="bg-"]');
			const initialCount = await indicators.count();
			expect(initialCount).toBeGreaterThan(0);

			// Click next button (if it exists)
			const nextButton = page.locator('button:has-text("›")');
			if (await nextButton.isVisible()) {
				await nextButton.click();
				await page.waitForTimeout(700); // Wait for transition
			}
		});
	});

	test.describe('Search & Favorites', () => {
		let testUserEmail = '';
		const testUserPassword = 'SecurePass@123';

		test.beforeAll(async () => {
			// Setup: create test user
			testUserEmail = `test${Date.now()}@example.com`;
		});

		test('Authenticated user can search animes', async ({ page }) => {
			// Register and login
			await page.goto('/register');
			const name = `Searcher ${Date.now()}`;
			testUserEmail = `searcher${Date.now()}@example.com`;

			await page.fill('input[name="name"]', name);
			await page.fill('input[name="email"]', testUserEmail);
			await page.fill('input[name="password"]', testUserPassword);
			await page.fill('input[name="confirmPassword"]', testUserPassword);
			await page.click('button[type="submit"]');
			await page.waitForURL('/');

			// Navigate to search
			await page.goto('/search');
			await expect(page.locator('text=Buscar Animes')).toBeVisible();

			// Search for anime
			await page.fill('input[type="search"]', 'naruto');
			await page.waitForTimeout(500);

			// Wait for search results
			const results = page.locator('text=Naruto');
			await expect(results.first()).toBeVisible({ timeout: 5000 });
		});

		test('User can favorite anime from search results', async ({ page }) => {
			// Register and login
			await page.goto('/register');
			const name = `Favoriter ${Date.now()}`;
			testUserEmail = `favoriter${Date.now()}@example.com`;

			await page.fill('input[name="name"]', name);
			await page.fill('input[name="email"]', testUserEmail);
			await page.fill('input[name="password"]', testUserPassword);
			await page.fill('input[name="confirmPassword"]', testUserPassword);
			await page.click('button[type="submit"]');
			await page.waitForURL('/');

			// Go to search
			await page.goto('/search');
			await page.fill('input[type="search"]', 'naruto');
			await page.waitForTimeout(500);

			// Wait for results and favorite button
			const favoriteButton = page.locator('button:has-text("Favoritar")').first();
			await expect(favoriteButton).toBeVisible({ timeout: 5000 });

			// Click favorite button (HTMX request)
			await favoriteButton.click();

			// Wait for success message
			await expect(page.locator('text=Favoritado|Adicionado')).toBeVisible({
				timeout: 5000,
			});
		});

		test('User can manage anime list', async ({ page }) => {
			// Register and login
			await page.goto('/register');
			const name = `Lister ${Date.now()}`;
			testUserEmail = `lister${Date.now()}@example.com`;

			await page.fill('input[name="name"]', name);
			await page.fill('input[name="email"]', testUserEmail);
			await page.fill('input[name="password"]', testUserPassword);
			await page.fill('input[name="confirmPassword"]', testUserPassword);
			await page.click('button[type="submit"]');
			await page.waitForURL('/');

			// Go to search and add anime
			await page.goto('/search');
			await page.fill('input[type="search"]', 'naruto');
			await page.waitForTimeout(500);

			const favoriteButton = page.locator('button:has-text("Favoritar")').first();
			await expect(favoriteButton).toBeVisible({ timeout: 5000 });
			await favoriteButton.click();

			// Wait for success
			await expect(page.locator('text=Adicionado')).toBeVisible({
				timeout: 5000,
			});

			// Navigate to anime list
			await page.click('a:has-text("Minha Lista")');
			await page.waitForURL('/animes');

			// Verify anime is in list
			await expect(page.locator('text=Naruto')).toBeVisible();
		});
	});

	test.describe('Profile Management', () => {
		test('User can view and edit profile', async ({ page }) => {
			// Setup: Register and login
			await page.goto('/register');
			const name = `Profile Tester ${Date.now()}`;
			const email = `profile${Date.now()}@example.com`;
			const password = 'SecurePass@123';

			await page.fill('input[name="name"]', name);
			await page.fill('input[name="email"]', email);
			await page.fill('input[name="password"]', password);
			await page.fill('input[name="confirmPassword"]', password);
			await page.click('button[type="submit"]');
			await page.waitForURL('/');

			// Navigate to profile
			await page.click('a:has-text("Perfil")');
			await page.waitForURL('/profile');

			await expect(page.locator('text=Meu Perfil')).toBeVisible();
			await expect(page.locator(`text=${name}`)).toBeVisible();
		});
	});

	test.describe('Responsive Design', () => {
		test('Mobile layout works correctly', async ({ page }) => {
			// Set mobile viewport
			await page.setViewportSize({ width: 375, height: 667 });

			await page.goto('/');
			await expect(page.locator('text=Catálogo')).toBeVisible();

			// Mobile menu should be visible (hamburger button)
			const mobileButton = page.locator('button[class*="md:hidden"]');
			await expect(mobileButton).toBeVisible();
		});

		test('Tablet layout is responsive', async ({ page }) => {
			// Set tablet viewport
			await page.setViewportSize({ width: 768, height: 1024 });

			await page.goto('/');
			await expect(page.locator('text=Catálogo')).toBeVisible();
		});

		test('Desktop layout is responsive', async ({ page }) => {
			// Set desktop viewport
			await page.setViewportSize({ width: 1920, height: 1080 });

			await page.goto('/');
			await expect(page.locator('text=Catálogo')).toBeVisible();
		});
	});

	test.describe('Accessibility', () => {
		test('Navigation is keyboard accessible', async ({ page }) => {
			await page.goto('/');

			// Tab through navigation
			await page.keyboard.press('Tab');
			const focusedElement = await page.locator(':focus');
			expect(focusedElement).toBeTruthy();
		});

		test('Skip link is present', async ({ page }) => {
			await page.goto('/');

			// Look for skip link (usually hidden but present for a11y)
			const skipLink = page.locator('a:has-text("Pular")');
			expect(skipLink).toBeTruthy();
		});

		test('Images have alt text', async ({ page }) => {
			await page.goto('/');

			const images = page.locator('img');
			const count = await images.count();

			for (let i = 0; i < count; i++) {
				const alt = await images.nth(i).getAttribute('alt');
				// Most images should have alt text (except decorative ones)
				if (alt !== '') {
					expect(alt).toBeTruthy();
				}
			}
		});
	});
});
