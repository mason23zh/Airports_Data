#! /app/.heroku/node/bin/node

/*
 * The importVatsimEvents will run in the Heroku Scheduler
 * This task will run every 12 hours.
 * */

const { importVatsimEventsToDb } = require("../index");
const logger = require("../logger/index");

(async () => {
    try {
        await importVatsimEventsToDb();
    } catch (e) {
        logger.error("Error occurred in scheduleJob:importFaaAtisToDB():", e);
    }
})();
