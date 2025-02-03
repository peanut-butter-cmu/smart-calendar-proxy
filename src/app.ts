import "reflect-metadata";
import express from "express";
import { createRouter } from "./routes/index.js"
import { configDotenv } from "dotenv";
import { dataSource } from "./dataSource.js";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import cors from "cors";

configDotenv({ path: ".env" });
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault(process.env.APP_TIMEZONE);

const allowedOrigins = process.env.APP_ALLOWED_ORIGINS?.split(",") || [];
const port = process.env.APP_PORT || 3000;
const app = express();
const corsMiddleware = cors({ origin: allowedOrigins, credentials: true });

app.use(express.json());
app.use(corsMiddleware);
app.options("*", corsMiddleware);
dataSource.initialize().then(initializedDS => {
    app.use(createRouter(initializedDS));
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
}).catch(console.error);
