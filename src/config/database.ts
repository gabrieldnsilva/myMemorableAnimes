import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const sequelize = new Sequelize({
	dialect: "sqlite",
	storage: path.join(__dirname, "../../database/myMemorableAnimes.db"),
	logging: process.env.NODE_ENV === "development" ? console.log : false,
	define: {
		timestamps: true,
		underscored: true,
	},
});

export const testConnection = async (): Promise<void> => {
	try {
		await sequelize.authenticate();
		console.log("✅ Database connection established successfully.");
	} catch (error) {
		console.error("❌ Unable to connect to the database:", error);
		process.exit(1);
	}
};

export const syncDatabase = async (): Promise<void> => {
	try {
		await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
		console.log("✅ Database synchronized.");
	} catch (error) {
		console.error("❌ Database sync error:", error);
	}
};

export default sequelize;
