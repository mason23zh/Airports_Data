#! /app/.heroku/node/bin/node
/*
 * The importFaaAtis will run in the Heroku Scheduler
 * This task will run every 60 minutes.
 * */
const { importFaaAtisToDB } = require("../utils/ATIS/importFaaAtisToDB");
const logger = require("../logger/index");
(async () => {
    try {
        logger.info("Import FAA Atis to DB.");
        await importFaaAtisToDB();
    } catch (e) {
        logger.error("Error occurred in scheduleJob:importFaaAtisToDB():", e);
    }
})();