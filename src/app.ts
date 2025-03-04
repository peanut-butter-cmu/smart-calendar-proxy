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
import { initCronJobs } from "./app/cron.js";
import { initFirebase } from "./app/firebase.js";

configDotenv({ path: ".env" });
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault(process.env.TZ);

const allowedOrigins = process.env.APP_ALLOWED_ORIGINS?.split(",") || [];
const port = process.env.APP_PORT || 3000;
const app = express();
const corsMiddleware = cors({ // result from GPT
  origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
          callback(null, origin); // 👈 Return the origin instead of `true`
      } else {
          callback(new Error("Not allowed by CORS"));
      }
  },
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept, Authorization",
});


app.use(express.json());
app.use(corsMiddleware);
app.options("*", corsMiddleware);
dataSource.initialize().then(async initializedDS => {
    initFirebase();
    initCronJobs(initializedDS);
    app.use(createRouter(initializedDS));
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
}).catch(console.error);
