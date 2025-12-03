import sequelize from "../src/config/database";

export default async function globalTeardown() {
	await sequelize.close();
}
