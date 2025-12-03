module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/tests"],
	testMatch: ["**/*.test.ts", "**/*.spec.ts"],
	collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/server.ts"],
	coverageDirectory: "coverage",
	coverageReporters: ["text", "lcov", "html"],
	coverageThreshold: {
		global: {
			branches: 58, // Ajustado temporariamente
			functions: 70,
			lines: 70,
			statements: 70,
		},
	},
	moduleFileExtensions: ["ts", "js", "json"],
	verbose: true,
	testTimeout: 10000,
	maxWorkers: 1, // Run tests sequentially to avoid database conflicts
};
