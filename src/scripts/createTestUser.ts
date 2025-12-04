import dotenv from "dotenv";
import AuthService from "../services/AuthService";
import { testConnection } from "../config/database";

dotenv.config();

async function createTestUser() {
	try {
		// Test database connection
		await testConnection();

		// Create test user
		const testUser = {
			email: "test@test.com",
			password: "Test123!",
			name: "Usuário Teste",
		};

		console.log("🔧 Creating test user...");
		console.log(`Email: ${testUser.email}`);
		console.log(`Password: ${testUser.password}`);

		const user = await AuthService.createUser({
			email: testUser.email,
			password: testUser.password,
			name: testUser.name,
		});

		console.log("✅ Test user created successfully!");
		console.log(`User ID: ${user.id}`);
		console.log(
			"\n📝 You can now login with:\nEmail: test@test.com\nPassword: Test123!"
		);
	} catch (error) {
		if (
			error instanceof Error &&
			error.message === "Email already registered"
		) {
			console.log("⚠️  Test user already exists");
			console.log(
				"📝 Login with:\nEmail: test@test.com\nPassword: Test123!"
			);
		} else {
			console.error("❌ Error creating test user:", error);
		}
	}

	process.exit(0);
}

createTestUser();
