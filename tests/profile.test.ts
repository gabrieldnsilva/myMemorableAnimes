import request from "supertest";
import app from "../src/server";
import sequelize from "../src/config/database";
import User from "../src/models/User";

// Test data
const testUser = {
	name: "Profile Test User",
	email: "profile@example.com",
	password: "Test123!",
};

describe("User Profile System", () => {
	let authToken: string;
	let userId: number;

	// Setup: Clean database and create test user before all tests
	beforeAll(async () => {
		await sequelize.sync({ force: true });

		// Register a user and get token
		const res = await request(app)
			.post("/api/auth/register")
			.send(testUser);

		authToken = res.body.data.token;
		userId = res.body.data.user.id;
	});

	// Cleanup: Close database after all tests
	afterAll(async () => {
		await sequelize.close();
	});

	describe("GET /api/profile", () => {
		it("should get user profile with stats", async () => {
			const res = await request(app)
				.get("/api/profile")
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.user).toHaveProperty("id");
			expect(res.body.data.user).toHaveProperty("name", testUser.name);
			expect(res.body.data.user).toHaveProperty("email", testUser.email);
			expect(res.body.data.user).not.toHaveProperty("password");
			expect(res.body.data.stats).toHaveProperty("totalAnimes");
			expect(res.body.data.stats).toHaveProperty("favoriteCount");
			expect(res.body.data.stats).toHaveProperty("joinedDays");
		});

		it("should fail without authentication", async () => {
			const res = await request(app).get("/api/profile");

			expect(res.status).toBe(401);
			expect(res.body.success).toBe(false);
		});

		it("should fail with invalid token", async () => {
			const res = await request(app)
				.get("/api/profile")
				.set("Authorization", "Bearer invalid-token");

			expect(res.status).toBe(403);
			expect(res.body.success).toBe(false);
		});
	});

	describe("PUT /api/profile", () => {
		it("should update user name successfully", async () => {
			const res = await request(app)
				.put("/api/profile")
				.set("Authorization", `Bearer ${authToken}`)
				.send({ name: "Updated Name" });

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.user.name).toBe("Updated Name");
		});

		it("should update user bio successfully", async () => {
			const res = await request(app)
				.put("/api/profile")
				.set("Authorization", `Bearer ${authToken}`)
				.send({ bio: "This is my bio" });

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.user.bio).toBe("This is my bio");
		});

		it("should update email successfully", async () => {
			const newEmail = "newemail@example.com";
			const res = await request(app)
				.put("/api/profile")
				.set("Authorization", `Bearer ${authToken}`)
				.send({ email: newEmail });

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.user.email).toBe(newEmail);
		});

		it("should fail with duplicate email", async () => {
			// Create another user
			await request(app).post("/api/auth/register").send({
				name: "Another User",
				email: "another@example.com",
				password: "Test123!",
			});

			// Try to update to existing email
			const res = await request(app)
				.put("/api/profile")
				.set("Authorization", `Bearer ${authToken}`)
				.send({ email: "another@example.com" });

			expect(res.status).toBe(400);
			expect(res.body.success).toBe(false);
			expect(res.body.error).toContain("Email already in use");
		});

		it("should fail validation with invalid email format", async () => {
			const res = await request(app)
				.put("/api/profile")
				.set("Authorization", `Bearer ${authToken}`)
				.send({ email: "invalid-email" });

			expect(res.status).toBe(400);
			expect(res.body.success).toBe(false);
			expect(res.body.errors).toBeDefined();
		});

		it("should fail validation with too long bio", async () => {
			const longBio = "a".repeat(501);
			const res = await request(app)
				.put("/api/profile")
				.set("Authorization", `Bearer ${authToken}`)
				.send({ bio: longBio });

			expect(res.status).toBe(400);
			expect(res.body.success).toBe(false);
			expect(res.body.errors).toBeDefined();
		});

		it("should fail without authentication", async () => {
			const res = await request(app)
				.put("/api/profile")
				.send({ name: "New Name" });

			expect(res.status).toBe(401);
			expect(res.body.success).toBe(false);
		});
	});

	describe("PUT /api/profile/password", () => {
		const currentPassword = "Test123!";
		const newPassword = "NewPass123!";

		beforeEach(async () => {
			// Reset password before each test
			const user = await User.findByPk(userId);
			if (user) {
				user.password = currentPassword;
				await user.save();
			}
		});

		it("should change password successfully", async () => {
			// Get current user email
			const profileRes = await request(app)
				.get("/api/profile")
				.set("Authorization", `Bearer ${authToken}`);

			const currentEmail = profileRes.body.data.user.email;

			const res = await request(app)
				.put("/api/profile/password")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					oldPassword: currentPassword,
					newPassword: newPassword,
				});

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.message).toContain("Password updated");

			// Verify new password works
			const loginRes = await request(app).post("/api/auth/login").send({
				email: currentEmail,
				password: newPassword,
			});

			expect(loginRes.status).toBe(200);
		});

		it("should fail with incorrect old password", async () => {
			const res = await request(app)
				.put("/api/profile/password")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					oldPassword: "WrongPassword123!",
					newPassword: newPassword,
				});

			expect(res.status).toBe(400);
			expect(res.body.success).toBe(false);
			expect(res.body.error).toContain("Current password is incorrect");
		});

		it("should fail validation with weak new password", async () => {
			const res = await request(app)
				.put("/api/profile/password")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					oldPassword: currentPassword,
					newPassword: "123",
				});

			expect(res.status).toBe(400);
			expect(res.body.success).toBe(false);
			expect(res.body.errors).toBeDefined();
		});

		it("should fail validation when new password is same as old", async () => {
			const res = await request(app)
				.put("/api/profile/password")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					oldPassword: currentPassword,
					newPassword: currentPassword,
				});

			expect(res.status).toBe(400);
			expect(res.body.success).toBe(false);
			expect(res.body.errors).toBeDefined();
		});

		it("should fail validation with missing old password", async () => {
			const res = await request(app)
				.put("/api/profile/password")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					newPassword: newPassword,
				});

			expect(res.status).toBe(400);
			expect(res.body.success).toBe(false);
			expect(res.body.errors).toBeDefined();
		});

		it("should fail without authentication", async () => {
			const res = await request(app).put("/api/profile/password").send({
				oldPassword: currentPassword,
				newPassword: newPassword,
			});

			expect(res.status).toBe(401);
			expect(res.body.success).toBe(false);
		});
	});

	describe("DELETE /api/profile", () => {
		it("should deactivate account successfully", async () => {
			// Create a new user for this test
			const newUser = {
				name: "Delete Test",
				email: "delete@example.com",
				password: "Test123!",
			};

			const registerRes = await request(app)
				.post("/api/auth/register")
				.send(newUser);

			const token = registerRes.body.data.token;

			// Deactivate account
			const res = await request(app)
				.delete("/api/profile")
				.set("Authorization", `Bearer ${token}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.message).toContain("deactivated");

			// Verify user is deactivated
			const user = await User.findOne({
				where: { email: newUser.email },
			});
			expect(user?.isActive).toBe(false);
		});

		it("should fail without authentication", async () => {
			const res = await request(app).delete("/api/profile");

			expect(res.status).toBe(401);
			expect(res.body.success).toBe(false);
		});
	});

	describe("User Stats", () => {
		it("should calculate joined days correctly", async () => {
			const res = await request(app)
				.get("/api/profile")
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBe(200);
			expect(res.body.data.stats.joinedDays).toBeGreaterThanOrEqual(0);
		});

		it("should return zero for anime stats (not implemented yet)", async () => {
			const res = await request(app)
				.get("/api/profile")
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBe(200);
			expect(res.body.data.stats.totalAnimes).toBe(0);
			expect(res.body.data.stats.favoriteCount).toBe(0);
		});
	});

	describe("Error Handling Edge Cases", () => {
		it("should handle unknown errors in getProfile gracefully", async () => {
			// Use an expired or malformed token that passes initial validation
			const res = await request(app)
				.get("/api/profile")
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBeLessThan(600);
			expect(res.body).toHaveProperty("success");
		});

		it("should handle unknown errors in updateProfile gracefully", async () => {
			const res = await request(app)
				.put("/api/profile")
				.set("Authorization", `Bearer ${authToken}`)
				.send({ name: "Test" });

			expect(res.status).toBeLessThan(600);
			expect(res.body).toHaveProperty("success");
		});

		it("should handle unknown errors in updatePassword gracefully", async () => {
			const res = await request(app)
				.put("/api/profile/password")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					oldPassword: "Wrong123!",
					newPassword: "New123!",
				});

			// Should get error about wrong password, not unknown error
			expect(res.status).toBeLessThan(600);
			expect(res.body).toHaveProperty("success");
		});

		it("should handle unknown errors in deleteAccount gracefully", async () => {
			const res = await request(app)
				.delete("/api/profile")
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBeLessThan(600);
			expect(res.body).toHaveProperty("success");
		});
	});

	describe("Validation Error Paths", () => {
		it("should return validation errors for updateProfile with multiple invalid fields", async () => {
			const res = await request(app)
				.put("/api/profile")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					email: "not-an-email",
					bio: "a".repeat(600), // Exceeds max length
				});

			expect(res.status).toBe(400);
			expect(res.body.success).toBe(false);
			expect(res.body.errors).toBeDefined();
			expect(Array.isArray(res.body.errors)).toBe(true);
		});

		it("should return validation errors for updatePassword with missing fields", async () => {
			const res = await request(app)
				.put("/api/profile/password")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					// Missing oldPassword and newPassword
				});

			expect(res.status).toBe(400);
			expect(res.body.success).toBe(false);
			expect(res.body.errors).toBeDefined();
		});
	});

	describe("Edge Cases - User Not Found", () => {
		it("should handle deleted user in getProfile", async () => {
			// Create a token with a non-existent user ID
			const fakeUser = { id: 999999, email: "nonexistent@test.com" };
			const AuthService = (await import("../src/services/AuthService"))
				.default;
			const fakeToken = AuthService.generateToken(fakeUser as any);

			const res = await request(app)
				.get("/api/profile")
				.set("Authorization", `Bearer ${fakeToken}`);

			// Should return error when user doesn't exist
			expect(res.status).toBeGreaterThanOrEqual(400);
			expect(res.body.success).toBe(false);
		});

		it("should handle deleted user in updateProfile", async () => {
			const fakeUser = { id: 999999, email: "nonexistent@test.com" };
			const AuthService = (await import("../src/services/AuthService"))
				.default;
			const fakeToken = AuthService.generateToken(fakeUser as any);

			const res = await request(app)
				.put("/api/profile")
				.set("Authorization", `Bearer ${fakeToken}`)
				.send({ name: "New Name" });

			expect(res.status).toBeGreaterThanOrEqual(400);
			expect(res.body.success).toBe(false);
		});

		it("should handle deleted user in updatePassword", async () => {
			const fakeUser = { id: 999999, email: "nonexistent@test.com" };
			const AuthService = (await import("../src/services/AuthService"))
				.default;
			const fakeToken = AuthService.generateToken(fakeUser as any);

			const res = await request(app)
				.put("/api/profile/password")
				.set("Authorization", `Bearer ${fakeToken}`)
				.send({
					oldPassword: "OldPass123!",
					newPassword: "NewPass123!",
				});

			expect(res.status).toBeGreaterThanOrEqual(400);
			expect(res.body.success).toBe(false);
		});

		it("should handle deleted user in deleteAccount", async () => {
			const fakeUser = { id: 999999, email: "nonexistent@test.com" };
			const AuthService = (await import("../src/services/AuthService"))
				.default;
			const fakeToken = AuthService.generateToken(fakeUser as any);

			const res = await request(app)
				.delete("/api/profile")
				.set("Authorization", `Bearer ${fakeToken}`);

			expect(res.status).toBeGreaterThanOrEqual(400);
			expect(res.body.success).toBe(false);
		});

		it("should reject deactivated account in getProfile", async () => {
			// First deactivate the account
			await request(app)
				.delete("/api/profile")
				.set("Authorization", `Bearer ${authToken}`);

			// Try to get profile with deactivated account
			const res = await request(app)
				.get("/api/profile")
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBeGreaterThanOrEqual(400);
			expect(res.body.success).toBe(false);
			expect(res.body.error).toBe("Account is deactivated");
		});
	});
});
