import { configDotenv } from "dotenv";
import { DataSource } from "typeorm";

configDotenv({ path: ".env" }); // need to load manually.
export const dataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL!,
    entities: [ "./dist/models/*.entity.js" ],
    migrations: [ "./dist/migrations/*-migration.js" ]
});
