import { DataSource } from "typeorm";

export function createDatasource() {
    return new DataSource({
        type: "postgres",
        url: process.env.DATABASE_URL!,
        entities: ["./**/*.entity{.ts,.js}"],
        synchronize: true
    });
}