require("dotenv").config({ path: "./config.env" });
const mongoose = require("mongoose");
const app = require("./app");
const { AwcWeatherMetarSchema } = require("./models/weather/awcWeatherModel");
const schedule = require("node-schedule");
const { SecondaryConnection } = require("./secondaryDbConnection");
const { awcMetarSchema } = require("./redis/awcMetar");
const RedisClient = require("./redis/RedisClient");
const { Client } = require("redis-om");
const { CronJob } = require("cron");

const { importVatsimEventsToDb, importMetarsToDB, importVatsimTrafficsToDb } = require("./index");

const redisClient = new RedisClient();
let vatsimRedisClient;
//let vatsimRedisClientNoTrack;
(async () => {
    vatsimRedisClient = await new Client().open(process.env.REDISCLOUD_VATSIM_TRAFFIC_DEV);
})();

const Latest_AwcWeatherModel = SecondaryConnection.model(
    "AwcWeatherMetarModel_Latest",
    AwcWeatherMetarSchema
);
mongoose.set("strictQuery", false); //to avoid 'strictQuery' deprecation warning
mongoose.connect(`${process.env.DATABASE}`).then(() => {
    console.log("DB connected");
    (async () => {
        try {
            await redisClient.openNewRedisOMClient(process.env.REDISCLOUD_URL);
            const awcRepo = redisClient.createRedisOMRepository(awcMetarSchema);
            await awcRepo.createIndex();
            const currentClient = redisClient.getCurrentClient();
            currentClient.close();
        } catch (e) {
            console.log("Error connecting to Redis", e);
        }
    })();
    schedule.scheduleJob("*/10 * * * *", async () => {
        try {
            await importMetarsToDB(Latest_AwcWeatherModel, redisClient);
        } catch (e) {
            console.error("Error occurred in scheduleJob:importMetarsToDB():", e);
        }
    });
    // every 12 hours
    schedule.scheduleJob("0 0 0/12 1/1 * ? *", async () => {
        try {
            await importVatsimEventsToDb();
        } catch (e) {
            console.error("Error occurred in scheduleJob:importVatsimEventsToDb():", e);
        }
    });
    // every 20 seconds

    CronJob.from({
        cronTime: "*/30 * * * * *",
        onTick: async () => {
            try {
                await importVatsimTrafficsToDb(vatsimRedisClient);
            } catch (e) {
                console.error("Error occurred in CronJob:importVatsimTrafficsToDB():", e);
            }
        },
        start: true,
        timeZone: "America/Los_Angeles",
        runOnInit: true
    });
});
const port = process.env.PORT || 80;
app.listen(port, () => {
    console.log(`Express starts on port ${port}`);
});
