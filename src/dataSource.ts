import { DataSource } from "typeorm";

const IS_PRODUCTION = process.env.NODE_ENV !== 'development';
export function createDatasource() {
    return new DataSource({
        type: "postgres",
        url: process.env.DATABASE_URL!,
        entities: [ IS_PRODUCTION ? "./dist/**/*.entity.js" : "./**/*.entity.ts" ],
        synchronize: !IS_PRODUCTION,
    });
}