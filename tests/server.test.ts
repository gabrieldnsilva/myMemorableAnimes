import request from "supertest";
import app from "../src/server";
import sequelize from "../src/config/database";

describe("API Health Check", () => {
	// Setup database before tests
	beforeAll(async () => {
		await sequelize.sync({ force: true });
	});

	// Close database after tests
	afterAll(async () => {
		await sequelize.close();
	});

	it("should return 200 on /health route", async () => {
		const response = await request(app).get("/health");
		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("status", "OK");
		expect(response.body).toHaveProperty("uptime");
	});

	it("should return 404 for unknown routes", async () => {
		const response = await request(app).get("/unknown-route");
		expect(response.status).toBe(404);
		// Just check it returns 404, content may be HTML or JSON depending on routing
		expect(response.status).toBe(404);
	});
});
