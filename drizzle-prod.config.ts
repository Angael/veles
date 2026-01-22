import { defineConfig } from "drizzle-kit";

if (!process.env.PROD_DATABASE_URL) {
	throw new Error("PROD_DATABASE_URL is not defined in environment variables");
}

export default defineConfig({
	out: "./drizzle",
	schema: "./src/db/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.PROD_DATABASE_URL,
	},
});
