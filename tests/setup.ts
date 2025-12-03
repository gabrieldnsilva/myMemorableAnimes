import sequelize from "../src/config/database";

export default async function globalSetup() {
	// Set test environment
	process.env.NODE_ENV = "test";

	// Connect to database
	await sequelize.sync({ force: true });
}
