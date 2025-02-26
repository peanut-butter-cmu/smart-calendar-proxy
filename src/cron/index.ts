import cron from "node-cron";

export function initCronJobs() {
    // Schedule a task to run every 10s
    cron.schedule("*/10 * * * * *", () => {
        console.log("Cron Job: Hello World!", new Date().toISOString());
    });

    console.log("Cron jobs initialized");
};
