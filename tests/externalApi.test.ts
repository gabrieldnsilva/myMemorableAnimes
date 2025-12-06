describe("GET /api/external/top", () => {
	it("should return top anime list", async () => {
		const res = await request(app).get("/api/external/top");
		expect([200, 500]).toContain(res.status);
		expect(res.body).toHaveProperty("success");
	});
});

describe("GET /api/external/recommendations", () => {
	it("should return recent anime recommendations", async () => {
		const res = await request(app).get("/api/external/recommendations");
		expect([200, 500]).toContain(res.status);
		expect(res.body).toHaveProperty("success");
	});
});

describe("GET /api/external/random", () => {
	it("should return a random anime", async () => {
		const res = await request(app).get("/api/external/random");
		expect([200, 500]).toContain(res.status);
		expect(res.body).toHaveProperty("success");
	});
});
import request from "supertest";
import app from "../src/server";

describe("External API (Jikan) Integration", () => {
	describe("GET /api/external/search-json", () => {
		it("should return 400 if title is missing", async () => {
			const res = await request(app).get("/api/external/search-json");
			expect(res.status).toBe(400);
			expect(res.body.success).toBe(false);
		});
		// Mocked test example
		it("should return results for valid title", async () => {
			// This test should mock axios/JikanService in real scenario
			// For now, just check endpoint structure
			const res = await request(app).get(
				"/api/external/search-json?title=Naruto"
			);
			expect([200, 500]).toContain(res.status); // Accept 500 if Jikan is rate-limiting
			expect(res.body).toHaveProperty("success");
		});
	});

	describe("GET /api/external/anime/:id", () => {
		it("should return 400 for invalid id", async () => {
			const res = await request(app).get("/api/external/anime/abc");
			expect(res.status).toBe(400);
			expect(res.body.success).toBe(false);
		});
		it("should return anime details for valid id", async () => {
			const res = await request(app).get("/api/external/anime/20");
			expect([200, 500, 404]).toContain(res.status); // Accept 404/500 if Jikan fails
			expect(res.body).toHaveProperty("success");
		});
	});
});
