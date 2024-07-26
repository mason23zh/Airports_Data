require("dotenv").config({ path: "./config.env" });
const mongoose = require("mongoose");
const app = require("./app");
const { AwcWeatherMetarSchema } = require("./models/weather/awcWeatherModel");
const schedule = require("node-schedule");
const { SecondaryConnection } = require("./secondaryDbConnection");
const RedisClient = require("./redis/RedisClient");
const { CronJob } = require("cron");
const { importVatsimEventsToDb, importMetarsToDB, importVatsimTrafficsToDb } = require("./index");
const logger = require("./logger/index");
const { importFaaAtisToDB } = require("./utils/ATIS/importFaaAtisToDB");

const REDIS_VATSIM_URL =
    process.env.NODE_ENV === "production"
        ? process.env.REDISCLOUD_VATSIM_TRAFFIC_URL
        : process.env.REDISCLOUD_VATSIM_TRAFFIC_DEV;

const trafficRedisClient = new RedisClient();
const metarRedisClient = new RedisClient();

const Latest_AwcWeatherModel = SecondaryConnection.model(
    "AwcWeatherMetarModel_Latest",
    AwcWeatherMetarSchema
);
mongoose.set("strictQuery", false); //to avoid 'strictQuery' deprecation warning
mongoose.connect(`${process.env.DATABASE}`).then(() => {
    logger.info("DB connected");
    (async () => {
        try {
            await metarRedisClient.createRedisNodeConnection(process.env.REDISCLOUD_METAR_URL);
            logger.info("Metar redis connected.");
            await trafficRedisClient.createRedisNodeConnection(REDIS_VATSIM_URL);
            logger.info("Vatsim Traffic Redis connected");
        } catch (e) {
            logger.error("Error connecting to Redis:%O", e);
        }
    })();

    //Update FAA ATIS every 60 minutes
    schedule.scheduleJob("0 * * * *", async () => {
        try {
            await importFaaAtisToDB();
        } catch (e) {
            logger.error("Error occurred in scheduleJob:importFaaAtisToDB():", e);
        }
    });

    // (async () => {
    //     try {
    //         await importFaaAtisToDB();
    //     } catch (e) {
    //         logger.error("Error occurred in scheduleJob:importFaaAtisToDB():", e);
    //     }
    // })();

    // schedule.scheduleJob("*/10 * * * *", async () => {
    //     try {
    //         await importMetarsToDB(Latest_AwcWeatherModel, metarRedisClient);
    //     } catch (e) {
    //         logger.error("Error occurred in scheduleJob:importMetarsToDB():", e);
    //     }
    // });
    // every 12 hours
    // schedule.scheduleJob("0 0 0/12 1/1 * ? *", async () => {
    //     try {
    //         await importVatsimEventsToDb();
    //     } catch (e) {
    //         logger.error("Error occurred in scheduleJob:importVatsimEventsToDb():", e);
    //     }
    // });
    // every 20 seconds

    // CronJob.from({
    //     cronTime: "*/30 * * * * *",
    //     onTick: async () => {
    //         try {
    //             await importVatsimTrafficsToDb(trafficRedisClient);
    //         } catch (e) {
    //             logger.error("Error occurred in CronJob:importVatsimTrafficsToDB():%O", e);
    //         }
    //     },
    //     start: true,
    //     timeZone: "America/Los_Angeles",
    //     runOnInit: true
    // });
});
const port = process.env.PORT || 80;
app.listen(port, () => {
    logger.info(`Express starts on port ${port}`);
});
