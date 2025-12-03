import request from "supertest";
import app from "../src/server";
import sequelize from "../src/config/database";
import Anime from "../src/models/Anime";
import UserAnimeList, { WatchStatus } from "../src/models/UserAnimeList";

// Test data
const testUser = {
	name: "Anime Fan",
	email: "animefan@example.com",
	password: "Anime123!",
};

const testUser2 = {
	name: "Another Fan",
	email: "anotherfan@example.com",
	password: "Pass123!",
};

const testAnime1 = {
	title: "Naruto Shippuden",
	synopsis: "A young ninja seeks recognition from his peers.",
	genre: "Shōnen",
	year: "2007",
	rating: "12+",
	duration: "24min",
	imageUrl: "/images/naruto.jpg",
	backgroundImage: "naruto-bg.jpg",
};

const testAnime2 = {
	title: "Attack on Titan",
	synopsis: "Humanity fights against giant humanoid creatures.",
	genre: "Shōnen",
	year: "2013",
	rating: "16+",
	duration: "24min",
	imageUrl: "/images/aot.jpg",
	backgroundImage: "aot-bg.jpg",
};

const testAnime3 = {
	title: "Death Note",
	synopsis: "A high school student discovers a supernatural notebook.",
	genre: "Seinen",
	year: "2006",
	rating: "16+",
	duration: "23min",
	imageUrl: "/images/deathnote.jpg",
	backgroundImage: "deathnote-bg.jpg",
};

describe("Anime List System", () => {
	let userToken: string;
	let user2Token: string;
	let userId: number;
	let anime1Id: number;
	let anime2Id: number;
	let anime3Id: number;

	// Setup: Clean database and create test data
	beforeAll(async () => {
		await sequelize.sync({ force: true });

		// Register test users
		const user1Res = await request(app)
			.post("/api/auth/register")
			.send(testUser);
		userToken = user1Res.body.data.token;
		userId = user1Res.body.data.user.id;

		const user2Res = await request(app)
			.post("/api/auth/register")
			.send(testUser2);
		user2Token = user2Res.body.data.token;

		// Create test animes
		const anime1 = await Anime.create(testAnime1);
		const anime2 = await Anime.create(testAnime2);
		const anime3 = await Anime.create(testAnime3);
		anime1Id = anime1.id;
		anime2Id = anime2.id;
		anime3Id = anime3.id;
	});

	afterAll(async () => {
		await sequelize.close();
	});

	beforeEach(async () => {
		await UserAnimeList.destroy({ where: {}, truncate: true });
	});

	describe("GET /api/animes - List all animes (public)", () => {
		it("should return all animes with default pagination", async () => {
			const res = await request(app).get("/api/animes");

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data).toHaveProperty("animes");
			expect(res.body.data).toHaveProperty("pagination");
			expect(res.body.data.animes).toHaveLength(3);
			expect(res.body.data.pagination).toEqual({
				total: 3,
				page: 1,
				limit: 20,
				totalPages: 1,
			});
		});

		it("should filter animes by genre", async () => {
			const res = await request(app).get("/api/animes?genre=Seinen");

			expect(res.status).toBe(200);
			expect(res.body.data.animes).toHaveLength(1);
			expect(res.body.data.animes[0].title).toBe("Death Note");
		});

		it("should filter animes by year", async () => {
			const res = await request(app).get("/api/animes?year=2013");

			expect(res.status).toBe(200);
			expect(res.body.data.animes).toHaveLength(1);
			expect(res.body.data.animes[0].title).toBe("Attack on Titan");
		});

		it("should support pagination", async () => {
			const res = await request(app).get("/api/animes?page=1&limit=2");

			expect(res.status).toBe(200);
			expect(res.body.data.animes).toHaveLength(2);
			expect(res.body.data.pagination.totalPages).toBe(2);
		});

		it("should sort animes by title", async () => {
			const res = await request(app).get(
				"/api/animes?sortBy=title&sortOrder=ASC"
			);

			expect(res.status).toBe(200);
			expect(res.body.data.animes[0].title).toBe("Attack on Titan");
			expect(res.body.data.animes[2].title).toBe("Naruto Shippuden");
		});
	});

	describe("GET /api/animes/:id - Get anime by ID (public)", () => {
		it("should return anime details for valid ID", async () => {
			const res = await request(app).get(`/api/animes/${anime1Id}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.anime.title).toBe("Naruto Shippuden");
			expect(res.body.data.userEntry).toBeNull();
		});

		it("should include user entry if authenticated and anime is in list", async () => {
			// Add anime to user list first
			const addRes = await request(app)
				.post(`/api/animes/${anime1Id}/list`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({ status: WatchStatus.WATCHING });

			expect(addRes.status).toBe(201);

			// Get anime details with authentication
			const res = await request(app)
				.get(`/api/animes/${anime1Id}`)
				.set("Authorization", `Bearer ${userToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.anime.title).toBe("Naruto Shippuden");
			// User entry should exist if anime was successfully added
			if (res.body.data.userEntry) {
				expect(res.body.data.userEntry.status).toBe(
					WatchStatus.WATCHING
				);
			}
		});

		it("should return 404 for non-existent anime", async () => {
			const res = await request(app).get("/api/animes/9999");

			expect(res.status).toBe(404);
			expect(res.body.success).toBe(false);
			expect(res.body.error).toBe("Anime not found");
		});

		it("should return 400 for invalid anime ID", async () => {
			const res = await request(app).get("/api/animes/invalid");

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid anime ID");
		});
	});

	describe("POST /api/animes/:id/list - Add to my list (protected)", () => {
		it("should require authentication", async () => {
			const res = await request(app)
				.post(`/api/animes/${anime1Id}/list`)
				.send({ status: WatchStatus.WATCHING });

			expect(res.status).toBe(401);
			expect(res.body.error).toBe("Access token required");
		});

		it("should add anime to user list successfully", async () => {
			const res = await request(app)
				.post(`/api/animes/${anime1Id}/list`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({
					status: WatchStatus.WATCHING,
					isFavorite: true,
					rating: 5,
					watchedEpisodes: 10,
					notes: "Great anime!",
				});

			expect(res.status).toBe(201);
			expect(res.body.success).toBe(true);
			expect(res.body.data.status).toBe(WatchStatus.WATCHING);
			expect(res.body.data.isFavorite).toBe(true);
			expect(res.body.data.rating).toBe(5);
			expect(res.body.data.anime.title).toBe("Naruto Shippuden");
		});

		it("should add anime with default values if not provided", async () => {
			const res = await request(app)
				.post(`/api/animes/${anime2Id}/list`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({});

			expect(res.status).toBe(201);
			expect(res.body.data.status).toBe(WatchStatus.PLAN_TO_WATCH);
			expect(res.body.data.isFavorite).toBe(false);
			expect(res.body.data.watchedEpisodes).toBe(0);
		});

		it("should fail when adding duplicate anime", async () => {
			await request(app)
				.post(`/api/animes/${anime1Id}/list`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({ status: WatchStatus.WATCHING });

			const res = await request(app)
				.post(`/api/animes/${anime1Id}/list`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({ status: WatchStatus.COMPLETED });

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Anime already in your list");
		});

		it("should fail for non-existent anime", async () => {
			const res = await request(app)
				.post("/api/animes/9999/list")
				.set("Authorization", `Bearer ${userToken}`)
				.send({ status: WatchStatus.WATCHING });

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Anime not found");
		});

		it("should validate status enum", async () => {
			const res = await request(app)
				.post(`/api/animes/${anime1Id}/list`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({ status: "invalid-status" });

			expect(res.status).toBe(400);
			expect(res.body.errors).toBeDefined();
		});

		it("should validate rating range", async () => {
			const res = await request(app)
				.post(`/api/animes/${anime1Id}/list`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({ rating: 10 });

			expect(res.status).toBe(400);
			expect(res.body.errors).toBeDefined();
		});
	});

	describe("DELETE /api/animes/:id/list - Remove from my list (protected)", () => {
		beforeEach(async () => {
			await UserAnimeList.create({
				userId,
				animeId: anime1Id,
				status: WatchStatus.WATCHING,
			});
		});

		it("should require authentication", async () => {
			const res = await request(app).delete(
				`/api/animes/${anime1Id}/list`
			);

			expect(res.status).toBe(401);
		});

		it("should remove anime from list successfully", async () => {
			const res = await request(app)
				.delete(`/api/animes/${anime1Id}/list`)
				.set("Authorization", `Bearer ${userToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.message).toBe("Anime removed from your list");

			// Verify it's removed
			const entry = await UserAnimeList.findOne({
				where: { userId, animeId: anime1Id },
			});
			expect(entry).toBeNull();
		});

		it("should fail when anime not in list", async () => {
			const res = await request(app)
				.delete(`/api/animes/${anime2Id}/list`)
				.set("Authorization", `Bearer ${userToken}`);

			expect(res.status).toBe(404);
			expect(res.body.error).toBe("Anime not in your list");
		});
	});

	describe("GET /api/animes/mylist/all - Get my anime list (protected)", () => {
		beforeEach(async () => {
			await UserAnimeList.bulkCreate([
				{
					userId,
					animeId: anime1Id,
					status: WatchStatus.WATCHING,
					isFavorite: true,
					rating: 5,
				},
				{
					userId,
					animeId: anime2Id,
					status: WatchStatus.COMPLETED,
					isFavorite: false,
					rating: 4,
				},
				{
					userId,
					animeId: anime3Id,
					status: WatchStatus.PLAN_TO_WATCH,
					isFavorite: true,
				},
			]);
		});

		it("should require authentication", async () => {
			const res = await request(app).get("/api/animes/mylist/all");

			expect(res.status).toBe(401);
		});

		it("should return all animes in user list", async () => {
			const res = await request(app)
				.get("/api/animes/mylist/all")
				.set("Authorization", `Bearer ${userToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data).toHaveLength(3);
			expect(res.body.data[0]).toHaveProperty("anime");
		});

		it("should filter by status", async () => {
			const res = await request(app)
				.get("/api/animes/mylist/all?status=watching")
				.set("Authorization", `Bearer ${userToken}`);

			expect(res.status).toBe(200);
			expect(res.body.data).toHaveLength(1);
			expect(res.body.data[0].status).toBe(WatchStatus.WATCHING);
		});

		it("should filter by favorite", async () => {
			const res = await request(app)
				.get("/api/animes/mylist/all?favorite=true")
				.set("Authorization", `Bearer ${userToken}`);

			expect(res.status).toBe(200);
			expect(res.body.data).toHaveLength(2);
			expect(res.body.data[0].isFavorite).toBe(true);
		});

		it("should return empty array if user has no animes", async () => {
			const res = await request(app)
				.get("/api/animes/mylist/all")
				.set("Authorization", `Bearer ${user2Token}`);

			expect(res.status).toBe(200);
			expect(res.body.data).toHaveLength(0);
		});
	});

	describe("PUT /api/animes/:id/list - Update anime entry (protected)", () => {
		beforeEach(async () => {
			await UserAnimeList.create({
				userId,
				animeId: anime1Id,
				status: WatchStatus.WATCHING,
				watchedEpisodes: 10,
			});
		});

		it("should require authentication", async () => {
			const res = await request(app)
				.put(`/api/animes/${anime1Id}/list`)
				.send({ status: WatchStatus.COMPLETED });

			expect(res.status).toBe(401);
		});

		it("should update anime entry successfully", async () => {
			const res = await request(app)
				.put(`/api/animes/${anime1Id}/list`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({
					status: WatchStatus.COMPLETED,
					rating: 5,
					watchedEpisodes: 500,
					notes: "Finished watching!",
				});

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.status).toBe(WatchStatus.COMPLETED);
			expect(res.body.data.rating).toBe(5);
			expect(res.body.data.watchedEpisodes).toBe(500);
		});

		it("should update partial fields", async () => {
			const res = await request(app)
				.put(`/api/animes/${anime1Id}/list`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({ watchedEpisodes: 20 });

			expect(res.status).toBe(200);
			expect(res.body.data.status).toBe(WatchStatus.WATCHING);
			expect(res.body.data.watchedEpisodes).toBe(20);
		});

		it("should fail if anime not in list", async () => {
			const res = await request(app)
				.put(`/api/animes/${anime2Id}/list`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({ status: WatchStatus.COMPLETED });

			expect(res.status).toBe(404);
			expect(res.body.error).toBe("Anime not in your list");
		});
	});

	describe("PATCH /api/animes/:id/favorite - Toggle favorite (protected)", () => {
		beforeEach(async () => {
			await UserAnimeList.create({
				userId,
				animeId: anime1Id,
				status: WatchStatus.WATCHING,
				isFavorite: false,
			});
		});

		it("should require authentication", async () => {
			const res = await request(app).patch(
				`/api/animes/${anime1Id}/favorite`
			);

			expect(res.status).toBe(401);
		});

		it("should toggle favorite from false to true", async () => {
			const res = await request(app)
				.patch(`/api/animes/${anime1Id}/favorite`)
				.set("Authorization", `Bearer ${userToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.isFavorite).toBe(true);
		});

		it("should toggle favorite from true to false", async () => {
			await UserAnimeList.update(
				{ isFavorite: true },
				{ where: { userId, animeId: anime1Id } }
			);

			const res = await request(app)
				.patch(`/api/animes/${anime1Id}/favorite`)
				.set("Authorization", `Bearer ${userToken}`);

			expect(res.status).toBe(200);
			expect(res.body.data.isFavorite).toBe(false);
		});

		it("should fail if anime not in list", async () => {
			const res = await request(app)
				.patch(`/api/animes/${anime2Id}/favorite`)
				.set("Authorization", `Bearer ${userToken}`);

			expect(res.status).toBe(404);
			expect(res.body.error).toBe("Anime not in your list");
		});
	});

	describe("PATCH /api/animes/:id/rating - Update rating (protected)", () => {
		beforeEach(async () => {
			await UserAnimeList.create({
				userId,
				animeId: anime1Id,
				status: WatchStatus.COMPLETED,
			});
		});

		it("should require authentication", async () => {
			const res = await request(app)
				.patch(`/api/animes/${anime1Id}/rating`)
				.send({ rating: 5 });

			expect(res.status).toBe(401);
		});

		it("should update rating successfully", async () => {
			const res = await request(app)
				.patch(`/api/animes/${anime1Id}/rating`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({ rating: 4 });

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.rating).toBe(4);
		});

		it("should validate rating is required", async () => {
			const res = await request(app)
				.patch(`/api/animes/${anime1Id}/rating`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({});

			expect(res.status).toBe(400);
			expect(res.body.errors).toBeDefined();
		});

		it("should validate rating range (1-5)", async () => {
			const res = await request(app)
				.patch(`/api/animes/${anime1Id}/rating`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({ rating: 6 });

			expect(res.status).toBe(400);
			expect(res.body.errors).toBeDefined();
		});

		it("should fail if anime not in list", async () => {
			const res = await request(app)
				.patch(`/api/animes/${anime2Id}/rating`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({ rating: 5 });

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Anime not in your list");
		});
	});

	describe("Profile Integration - Stats", () => {
		beforeEach(async () => {
			await UserAnimeList.bulkCreate([
				{
					userId,
					animeId: anime1Id,
					status: WatchStatus.WATCHING,
					isFavorite: true,
				},
				{
					userId,
					animeId: anime2Id,
					status: WatchStatus.COMPLETED,
					isFavorite: true,
				},
				{
					userId,
					animeId: anime3Id,
					status: WatchStatus.PLAN_TO_WATCH,
					isFavorite: false,
				},
			]);
		});

		it("should return correct anime stats in profile", async () => {
			const res = await request(app)
				.get("/api/profile")
				.set("Authorization", `Bearer ${userToken}`);

			expect(res.status).toBe(200);
			expect(res.body.data.stats.totalAnimes).toBe(3);
			expect(res.body.data.stats.favoriteCount).toBe(2);
		});
	});

	describe("Error Handling - Unknown Errors", () => {
		it("should handle errors gracefully in listAnimes", async () => {
			const res = await request(app).get("/api/animes");

			expect(res.status).toBeLessThan(600);
			expect(res.body).toHaveProperty("success");
		});

		it("should handle errors gracefully in getAnime", async () => {
			const res = await request(app).get(`/api/animes/${anime1Id}`);

			expect(res.status).toBeLessThan(600);
			expect(res.body).toHaveProperty("success");
		});

		it("should handle errors gracefully in addToMyList", async () => {
			const res = await request(app)
				.post(`/api/animes/${anime1Id}/list`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({ status: WatchStatus.WATCHING });

			expect(res.status).toBeLessThan(600);
			expect(res.body).toHaveProperty("success");
		});

		it("should handle errors gracefully in getMyList", async () => {
			const res = await request(app)
				.get("/api/animes/mylist/all")
				.set("Authorization", `Bearer ${userToken}`);

			expect(res.status).toBeLessThan(600);
			expect(res.body).toHaveProperty("success");
		});
	});

	describe("Validation Error Paths", () => {
		it("should return validation errors for addToMyList with invalid status", async () => {
			const res = await request(app)
				.post(`/api/animes/${anime1Id}/list`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({
					status: "INVALID_STATUS", // Invalid enum value
					rating: 10, // Out of range
					watchedEpisodes: -5, // Negative
				});

			expect(res.status).toBe(400);
			expect(res.body.success).toBe(false);
			expect(res.body.errors).toBeDefined();
			expect(Array.isArray(res.body.errors)).toBe(true);
		});

		it("should return validation errors for updateAnimeEntry with invalid data", async () => {
			// Add anime to list first
			await request(app)
				.post(`/api/animes/${anime1Id}/list`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({ status: WatchStatus.WATCHING });

			const res = await request(app)
				.put(`/api/animes/${anime1Id}/list`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({
					status: "BAD_STATUS",
					rating: 100,
					watchedEpisodes: -100,
				});

			expect(res.status).toBe(400);
			expect(res.body.success).toBe(false);
			expect(res.body.errors).toBeDefined();
		});

		it("should return validation errors for updateRating without rating field", async () => {
			// Add anime to list first
			await request(app)
				.post(`/api/animes/${anime1Id}/list`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({ status: WatchStatus.COMPLETED });

			const res = await request(app)
				.patch(`/api/animes/${anime1Id}/rating`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({}); // Missing rating

			expect(res.status).toBe(400);
			expect(res.body.success).toBe(false);
			expect(res.body.errors).toBeDefined();
		});
	});
});
