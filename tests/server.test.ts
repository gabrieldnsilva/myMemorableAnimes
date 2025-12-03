import request from "supertest";
import app from "../src/server";

describe("API Health Check", () => {
	it("should return 200 on / route", async () => {
		const response = await request(app).get("/");
		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("message");
		expect(response.body).toHaveProperty("status", "running");
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
		expect(response.body).toHaveProperty("error", "Not Found");
	});
});
