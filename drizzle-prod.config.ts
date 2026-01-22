import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load environment file based on DB_ENV variable
// DB_ENV=prod -> loads .env.prod
// otherwise -> loads .env.local or .env

console.log("A:", process.env.A);
console.log(`DB_ENV: ${process.env.DB_ENV}`);

config({
	path: process.env.DB_ENV === "prod" ? [".env.prod"] : [".env"],
});

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not defined in environment variables");
}

console.log(`Using DATABASE_URL: ${process.env.DATABASE_URL}`);

export default defineConfig({
	out: "./drizzle",
	schema: "./src/db/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL,
	},
});
