const mongoose = require("mongoose");
const app = require("./app");
const { AwcWeatherMetarSchema } = require("./models/weather/awcWeatherModel");
const { downloadAndProcessAWCMetars } = require("./utils/AWC_Weather/download_weather");
require("dotenv").config({ path: "./config.env" });
const schedule = require("node-schedule");
const { normalizeData } = require("./utils/AWC_Weather/normalize_data");
const { SecondaryConnection } = require("./secondaryDbConnection");
const { awcMetarSchema } = require("./redis/awcMetar");
const RedisClient = require("./redis/RedisClient");
const VatsimData = require("./utils/Vatsim_data/VatsimData");
const { Client } = require("redis-om");
const { CronJob } = require("cron");

const redisClient = new RedisClient();
let vatsimRedisClient;
let vatsimRedisClientNoTrack;
(async () => {
    vatsimRedisClient = await new Client().open(process.env.REDISCLOUD_VATSIM_TRAFFIC_URL);
    vatsimRedisClientNoTrack = await new Client().open(
        process.env.REDISCLOUD_VATSIM_TRAFFIC_NO_TRACK_URL
    );
})();

async function importVatsimTrafficsToDb() {
    try {
        const vatsimData = new VatsimData();
        const result = await vatsimData.updateVatsimTrafficRedis(
            vatsimRedisClient,
            vatsimRedisClientNoTrack
        );
        return result;
    } catch (e) {
        return null;
    }
}

async function importVatsimEventsToDb() {
    try {
        const vatsimData = (await new VatsimData()).requestVatsimEventsData();
        const result = await (await vatsimData).storeVatsimEventsToDB();
        return result;
    } catch (e) {
        return null;
    }
}

async function importMetarsToDB(Latest_AwcWeatherModel) {
    try {
        let repo;
        console.log("start downloading data from AWC...");
        // const awcMetars = await downloadAndProcessAWCMetars(
        //     "https://www.aviationweather.gov/adds/dataserver_current/current/metars.cache.csv"
        // );
        const awcMetars = await downloadAndProcessAWCMetars(
            "https://aviationweather.gov/data/cache/metars.cache.csv.gz"
        );
        if (awcMetars.length && awcMetars.length > 0) {
            console.log("Download Finished, data length:", awcMetars.length);

            console.log("Starting normalizing awc metars...");
            const normalizedAwcMetar = await normalizeData();

            //Delete old data.
            console.log("Deleting old data...");
            await Latest_AwcWeatherModel.deleteMany({});
            console.log("Old data deleted");

            const rNodeClient = await redisClient.createRedisNodeConnection(
                process.env.REDISCLOUD_PASSWORD,
                process.env.REDISCLOUD_HOST,
                process.env.REDISCLOUD_PORT
            );

            //const rNodeClient = await redisClient.createRedisNodeConnectionWithURL(process.env.REDISCLOUD_URL);
            if (rNodeClient) {
                await rNodeClient.flushDb("SYNC", () => {
                    console.log("REDIS FLUSH");
                });

                console.log("Connecting to Redis...");
                await redisClient.openNewRedisOMClient(process.env.REDISCLOUD_URL);
                repo = redisClient.createRedisOMRepository(awcMetarSchema);

                console.log("store normalized metar into redis");
                await repo.createIndex();

                await Promise.all(
                    JSON.parse(normalizedAwcMetar).map(async (metar) => {
                        let updatedMetar = {
                            ...metar,
                            temp_c: Number(metar.temp_c),
                            dewpoint_c: Number(metar.dewpoint_c),
                            wind_dir_degrees: Number(metar.wind_dir_degrees),
                            wind_speed_kt: Number(metar.wind_speed_kt),
                            wind_gust_kt: Number(metar.wind_gust_kt),
                            visibility_statute_mi: Number(metar.visibility_statute_mi),
                            altim_in_hg: Number(metar.altim_in_hg),
                            elevation_m: Number(metar.elevation_m),
                            auto: metar.auto || "FALSE"
                        };
                        await repo.createAndSave(updatedMetar);
                    })
                );
                console.log("Disconnect redis client");
                const currentClient = redisClient.getCurrentClient();
                currentClient.close();
                await rNodeClient.quit();
            }

            //import new metar into the latest AWC Model
            console.log("Start importing data to Database...");
            const docs = await Latest_AwcWeatherModel.create(JSON.parse(normalizedAwcMetar));
            console.log("Data imported, total entries:", docs.length);

            console.log("Copy all data to AwcWeatherMetarModel...");
            await Latest_AwcWeatherModel.aggregate([{ $out: "awcweathermetarmodels" }]);
            console.log("Data merged successfully, Let's rock!");

            return normalizedAwcMetar.length;
        } else {
            console.log("AWC Metar download failed...");
            return;
        }
    } catch (e) {
        console.log("error import data", e);
    }
}

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
            const repo = redisClient.createRedisOMRepository(awcMetarSchema);
            await repo.createIndex();
            const currentClient = redisClient.getCurrentClient();
            currentClient.close();
        } catch (e) {
            console.log("Error connecting to Redis", e);
        }
    })();
    schedule.scheduleJob("*/10 * * * *", async () => {
        await importMetarsToDB(Latest_AwcWeatherModel);
    });
    // // every 12 hours
    schedule.scheduleJob("0 0 0/12 1/1 * ? *", async () => {
        await importVatsimEventsToDb();
    });
    // every 20 seconds

    CronJob.from({
        cronTime: "*/20 * * * * *",
        onTick: async () => await importVatsimTrafficsToDb(),
        start: true,
        timeZone: "America/Los_Angeles",
        runOnInit: true
    });
});
const port = process.env.PORT || 80;
app.listen(port, () => {
    console.log(`Express starts on port ${port}`);
});
