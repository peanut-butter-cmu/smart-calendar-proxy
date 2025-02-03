import { DataSource } from "typeorm";

export const createDataSource = (databaseURL: string) => new DataSource({
    type: "postgres",
    url: databaseURL,
    entities: [ 
        (process.env.NODE_ENV === "development") ? 
        "./src/models/*.entity.ts" : "./dist/models/*.entity.js"
    ],
    migrations: [ 
        (process.env.NODE_ENV === "development") ? 
        "./src/migrations/*-migration.ts" : "./dist/migrations/*-migration.js"
    ]
});
