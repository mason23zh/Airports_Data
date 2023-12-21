const mongoose = require("mongoose");
const app = require("./app");
const { AwcWeatherMetarSchema } = require("./models/weather/awcWeatherModel");
const {
    downloadAndUnzip,
    processDownloadAWCData
} = require("./utils/AWC_Weather/download_weather");
require("dotenv").config({ path: "./config.env" });
const schedule = require("node-schedule");
const { normalizeData } = require("./utils/AWC_Weather/normalize_data");
const { SecondaryConnection } = require("./secondaryDbConnection");
const { awcMetarSchema } = require("./redis/awcMetar");
const RedisClient = require("./redis/RedisClient");
const VatsimData = require("./utils/Vatsim_data/VatsimData");
const { Client } = require("redis-om");
const { CronJob } = require("cron");
const fs = require("fs").promises;

const redisClient = new RedisClient();
let vatsimRedisClient;
//let vatsimRedisClientNoTrack;
(async () => {
    vatsimRedisClient = await new Client().open(process.env.REDISCLOUD_VATSIM_TRAFFIC_URL);
    // vatsimRedisClientNoTrack = await new Client().open(
    //     process.env.REDISCLOUD_VATSIM_TRAFFIC_NO_TRACK_URL
    // );
})();

async function batchProcess(promiseArray, batchSize) {
    for (let i = 0; i < promiseArray.length; i += batchSize) {
        const batch = promiseArray.slice(i, i + batchSize);
        await Promise.all(batch);
    }
}

async function importVatsimTrafficsToDb() {
    try {
        const vatsimData = new VatsimData();
        const result = await vatsimData.updateVatsimTrafficRedis(vatsimRedisClient);
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
        let awcRepo;
        let normalizedAwcMetar;
        console.log("start downloading data from AWC...");
        await downloadAndUnzip("https://aviationweather.gov/data/cache/metars.cache.csv.gz");
        console.log("download complete. Start Processing downloaded AWC data...");
        await processDownloadAWCData();
        console.log("Process complete.");
        normalizedAwcMetar = await normalizeData();

        const rNodeClient = await redisClient.createRedisNodeConnection(
            process.env.REDISCLOUD_PASSWORD,
            process.env.REDISCLOUD_HOST,
            process.env.REDISCLOUD_PORT
        );

        //const rNodeClient = await redisClient.createRedisNodeConnectionWithURL(process.env.REDISCLOUD_URL);
        if (rNodeClient) {
            try {
                await rNodeClient.flushDb("SYNC", () => {
                    console.log("REDIS FLUSH");
                });

                console.log("Connecting to Redis...");
                await redisClient.openNewRedisOMClient(process.env.REDISCLOUD_URL);
                awcRepo = redisClient.createRedisOMRepository(awcMetarSchema);

                console.log("store normalized metar into redis");
                await awcRepo.createIndex();

                const awcPromises = normalizedAwcMetar.map(async (metar) => {
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
                    return awcRepo.save(updatedMetar);
                });
                await batchProcess(awcPromises, 30);

                console.log("Disconnect redis client");
                const currentClient = redisClient.getCurrentClient();
                currentClient.close();
                //await rNodeClient.quit();
            } catch (e) {
                console.log("Data import to Redis failed:", e);
            } finally {
                await rNodeClient.quit();
            }
        }

        //import new metar into the latest AWC Model
        console.log("Start importing data to Database...");
        if (Array.isArray(normalizedAwcMetar)) {
            try {
                console.log("Deleting old data...");
                await Latest_AwcWeatherModel.deleteMany({});
                console.log("Old data deleted");

                const docs = await Latest_AwcWeatherModel.insertMany(normalizedAwcMetar);
                console.log("Data imported, total entries:", docs.length);

                console.log("Copy all data to AwcWeatherMetarModel...");
                await Latest_AwcWeatherModel.aggregate([{ $out: "awcweathermetarmodels" }]);
                console.log("Data merged successfully, Let's rock!");
            } catch (e) {
                console.log("Data import to MongoDB failed:", e);
            }
        } else {
            console.error("Normalized Metar is not array. Unable to process");
        }

        try {
            await fs.unlink("./utils/AWC_Weather/Data/metars.json");
            console.log("metars.json deleted");
        } catch (e) {
            console.log("metars.json delete failed:", e);
        }

        return normalizedAwcMetar.length;
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
            const awcRepo = redisClient.createRedisOMRepository(awcMetarSchema);
            await awcRepo.createIndex();
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
        cronTime: "*/30 * * * * *",
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
