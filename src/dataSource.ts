import { configDotenv } from "dotenv";
import { DataSource } from "typeorm";

configDotenv({ path: ".env" }); // need to load manually.
export const dataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL!,
    entities: [ 
        (process.env.NODE_ENV === "development") ? 
        "./src/models/*.entity.ts" : "./dist/models/*.entity.js"
    ],
    migrations: [ 
        (process.env.NODE_ENV === "development") ? 
        "./src/migrations/*-migration.ts" : "./dist/migrations/*-migration.js"
    ]
});
