const VatsimData = require("./utils/Vatsim_data/VatsimData");
const {
    downloadAndUnzip,
    processDownloadAWCData
} = require("./utils/AWC_Weather/download_weather");
const { normalizeData } = require("./utils/AWC_Weather/normalize_data");
const { awcMetarSchema } = require("./redis/awcMetar");
const { promises: fs } = require("fs");
const { batchProcess } = require("./utils/batchProcess");
const logger = require("./logger/index");

module.exports.importVatsimTrafficsToDb = async (vatsimRedisClient) => {
    try {
        const vatsimData = new VatsimData();
        await vatsimData.updateVatsimTrafficRedis(vatsimRedisClient);
        await vatsimData.updateVatsimHistoryTraffic();
    } catch (e) {
        console.error("Error import Vatsim Traffic to DB:", e);
        return null;
    }
};

module.exports.importVatsimEventsToDb = async () => {
    try {
        logger.info("Start importing vatsim events to DB...");
        const vatsimData = (await new VatsimData()).requestVatsimEventsData();
        await (await vatsimData).storeVatsimEventsToDB();
        logger.info("Vatsim events import complete.");
    } catch (e) {
        logger.error("Error import Vatsim events to DB:%O", e);
        return null;
    }
};

module.exports.importMetarsToDB = async (Latest_AwcWeatherModel, redisClient) => {
    try {
        let normalizedAwcMetar;
        logger.info("start downloading data from AWC...");
        await downloadAndUnzip("https://aviationweather.gov/data/cache/metars.cache.csv.gz");
        logger.info("download complete. Start Processing downloaded AWC data...");
        await processDownloadAWCData();
        logger.info("Process complete.");
        normalizedAwcMetar = await normalizeData();

        if (redisClient) {
            try {
                logger.info("Connected to Redis");
                await redisClient.flushDb();
                const awcRepo = redisClient.createRedisRepository(awcMetarSchema);

                logger.info("store normalized metar into redis");
                await awcRepo.createIndex();

                const awcPromises = normalizedAwcMetar.map((metar) => {
                    return awcRepo.save(metar.station_id, metar);
                });
                await batchProcess(awcPromises, 30);
            } catch (e) {
                logger.error("Data import to Redis failed:%O", e);
            }
        }

        //import new metar into the latest AWC Model
        logger.info("Start importing data to Database...");
        if (Array.isArray(normalizedAwcMetar)) {
            try {
                logger.info("Deleting old data...");
                await Latest_AwcWeatherModel.deleteMany({});
                logger.info("Old data deleted");

                const docs = await Latest_AwcWeatherModel.insertMany(normalizedAwcMetar);
                logger.info("Data imported, total entries:", docs.length);

                logger.info("Copy all data to AwcWeatherMetarModel...");
                await Latest_AwcWeatherModel.aggregate([{ $out: "awcweathermetarmodels" }]);
                logger.info("Data merged successfully, Let's rock!");
            } catch (e) {
                logger.info("Data import to MongoDB failed:", e);
            }
        } else {
            logger.error("Normalized Metar is not array. Unable to process");
        }

        try {
            await fs.unlink("./utils/AWC_Weather/Data/metars.json");
            logger.info("metars.json deleted");
        } catch (e) {
            logger.error("metars.json delete failed:%O", e);
        }

        return normalizedAwcMetar.length;
    } catch (e) {
        logger.error("error import data:%O", e);
    }
};
