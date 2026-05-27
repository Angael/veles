import { createDrizzleConfig } from "drizzle.config";

export default createDrizzleConfig(process.env.PROD_DATABASE_URL);
