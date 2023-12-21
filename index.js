const VatsimData = require("./utils/Vatsim_data/VatsimData");
const {
    downloadAndUnzip,
    processDownloadAWCData
} = require("./utils/AWC_Weather/download_weather");
const { normalizeData } = require("./utils/AWC_Weather/normalize_data");
const { awcMetarSchema } = require("./redis/awcMetar");
const { promises: fs } = require("fs");

module.exports.importVatsimTrafficsToDb = async (vatsimRedisClient) => {
    try {
        const vatsimData = new VatsimData();
        await vatsimData.updateVatsimTrafficRedis(vatsimRedisClient);
    } catch (e) {
        console.error("Error import Vatsim Traffic to DB:", e);
        return null;
    }
};

module.exports.importVatsimEventsToDb = async () => {
    try {
        const vatsimData = (await new VatsimData()).requestVatsimEventsData();
        await (await vatsimData).storeVatsimEventsToDB();
    } catch (e) {
        console.error("Error import Vatsim events to DB", e);
        return null;
    }
};

module.exports.importMetarsToDB = async (Latest_AwcWeatherModel, redisClient) => {
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

                const awcPromises = normalizedAwcMetar.map((metar) => {
                    return awcRepo.save(metar.station_id, metar);
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
};

const batchProcess = async (promiseArray, batchSize) => {
    for (let i = 0; i < promiseArray.length; i += batchSize) {
        const batch = promiseArray.slice(i, i + batchSize);
        try {
            await Promise.all(batch);
        } catch (e) {
            console.error("Error process batch:", e);
            return;
        }
    }
};
