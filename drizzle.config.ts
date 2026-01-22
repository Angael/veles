import { defineConfig } from "drizzle-kit";

export const createDrizzleConfig = (dbUrl?: string) => {
	if (!dbUrl) {
		throw new Error("dbUrl is not defined in environment variables");
	}

	return defineConfig({
		out: "./drizzle",
		schema: "./src/db/schema.ts",
		dialect: "postgresql",
		dbCredentials: {
			url: dbUrl,
		},
	});
};

export default createDrizzleConfig(process.env.DATABASE_URL);
