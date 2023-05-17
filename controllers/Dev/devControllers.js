const mongoose = require("mongoose");
const { downloadAndProcessAWCMetars } = require("../../utils/AWC_Weather/download_weather");
const { AwcWeatherMetarModel, AwcWeatherMetarSchema } = require("../../models/weather/awcWeatherModel");
const { normalizeData } = require("../../utils/AWC_Weather/normalize_data");
const { redisNodeClient } = require("../../redis/client");
const { awcMetarRepository, awcMetarSchema } = require("../../redis/awcMetar");
const { filterOutGlobalAirportsUsingGNS430_data } = require("../../utils/Data_Convert/gns430AirportFilter");
const RedisClient = require("../../redis/RedisClient");
const rClient = new RedisClient();
//! DEV TESTING ONLY

// let repo;
// (async () => {
//     await rClient.openNewRedisOMClient(process.env.REDIS_URL);
//     repo = rClient.createRedisOMRepository(awcMetarSchema);
//     // const client = redisClient();
//     // const openClient = await client.open(process.env.REDIS_URL);
//     // repo = openClient.fetchRepository(awcMetarSchema);
// })();

const createItemToDB = async (data, model) => {
    let doc;
    try {
        doc = await model.create(data);
        console.log("data created");
    } catch (err) {
        console.log("error create data", err);
    }
    return doc;
};

exports.getAwcMetarsToDB = async (req, res, next) => {
    mongoose.connect(`${process.env.DATABASE}`);
    const db = mongoose.connection;
    db.once("connected", () => {
        console.log("connected to database for metar import");
        createItems();
    });

    async function createItems() {
        try {
            const awcMetars = await downloadAndProcessAWCMetars(
                "https://www.aviationweather.gov/adds/dataserver_current/current/metars.cache.csv"
            );
            console.log("Download Data Length:", awcMetars.length);
            const docs = await AwcWeatherMetarModel.create(awcMetars);
            console.log(docs.length);
        } catch (e) {
            console.log("error import data", e);
        }
    }

    next();
};

module.exports.normalizeCSV = async (req, res, next) => {
    const conn = mongoose.createConnection(`${process.env.DATABASE}`);
    const AwcWeatherModel = conn.model("AwcWeatherMetarModel", AwcWeatherMetarSchema);

    // normalizeData();
    async function createItems() {
        try {
            const normalizedMetar = await normalizeData();
            const docs = await AwcWeatherMetarModel.create(JSON.parse(normalizedMetar));
            console.log("Data imported, total entries:", docs.length);
            return docs;
        } catch (e) {
            console.log("error import data", e);
        }
    }

    const docs = await createItems();

    res.status(200).json({
        status: "success",
        data: docs.length,
    });
};

module.exports.getDownloadFile = async (req, res, next) => {
    async function createItems() {
        try {
            await rClient.openNewRedisOMClient(process.env.REDIS_URL);
            const repo = rClient.createRedisOMRepository(awcMetarSchema);
            // const client = redisClient();
            // const openClient = await client.open(process.env.REDIS_URL);
            // repo = openClient.fetchRepository(awcMetarSchema);

            const conn = mongoose.createConnection(`${process.env.DATABASE}`);
            const AwcWeatherModel = conn.model("AwcWeatherMetarModel_Latest", AwcWeatherMetarSchema);
            console.log("start downloading data from AWC...");
            const awcMetars = await downloadAndProcessAWCMetars(
                "https://www.aviationweather.gov/adds/dataserver_current/current/metars.cache.csv"
            );
            if (awcMetars.length && awcMetars.length > 0) {
                console.log("Download Finished, data length:", awcMetars.length);
                console.log("Deleting old data...");
                await AwcWeatherModel.deleteMany({});
                console.log("Clear redis cache...");
                const rnodeClient = await rClient.createRedisNodeConnectionWithURL(process.env.REDIS_URL);
                console.log("redis node client", rnodeClient);
                rnodeClient.flushAll("ASYNC", () => {
                    console.log("Redis cache flushed");
                });
                // const redisNode = await redisNodeClient();
                // redisNode.flushAll("ASYNC", () => {
                //     console.log("Redis cache flushed");
                // });
                console.log("Old data deleted");
                console.log("Starting normalizing awc metars...");
                const normalizedMetar = await normalizeData();

                console.log("store normalized metar into redis");
                // const client = await awcMetarRepository();
                // await client.dropIndex();
                await repo.createIndex();

                await Promise.all(
                    JSON.parse(normalizedMetar).map(async (metar) => {
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
                        };
                        await repo.createAndSave(updatedMetar);
                    })
                );

                console.log("Start importing data to Database...");
                const docs = await AwcWeatherModel.create(JSON.parse(normalizedMetar));
                console.log("Data imported, total entries:", docs.length);
                console.log("Copy all data to Model...");
                await AwcWeatherModel.aggregate([{ $out: "awcweathermetarmodels" }]);
                console.log("Disconnect redis client");
                const currentClient = rClient.getCurrentClient();
                currentClient.close();
                rnodeClient.quit();
                console.log("Data merged successfully, Let's rock!");
                return normalizedMetar;
            } else {
                return;
            }
        } catch (e) {
            console.log("error import data", e);
        }
    }

    const docs = await createItems();
    res.status(200).json({
        status: "success",
        data: docs.length,
    });
};

module.exports.getWindMetar = async (req, res, next) => {
    const { ICAO } = req.params;
    const metar = await AwcWeatherMetarModel.findOne({ station_id: `${ICAO.toUpperCase()}` });
    res.status(200).json({
        status: "success",
        data: metar,
    });
};

module.exports.getGlobalVisibility = async (req, res, next) => {
    const sortedMetars = await AwcWeatherMetarModel.find({ visibility_statute_mi: { $ne: null } }).sort({
        visibility_statute_mi: 1,
    });
    // const metars = await AwcWeatherMetarModel.sort({ visibility_statute_mi: "asc" });

    res.status(200).json({
        status: "success",
        length: sortedMetars.length,
        data: sortedMetars,
    });
};

module.exports.gns430AirportsFilter = async (req, res, next) => {
    filterOutGlobalAirportsUsingGNS430_data();
    res.status(200).json({
        status: "success",
    });
};

module.exports.redisTest = async (req, res, next) => {
    // const repo = await awcMetarRepository;

    // repo.createIndex();

    let tempObj = [
        {
            raw_text: "K0V4 190555Z AUTO 15003KT 10SM CLR 09/06 A2999 RMK AO1",
            station_id: "K0V4",
            observation_time: "2023-04-19T05:55:00.000Z",
            latitude: "37.15",
            longitude: "-79.02",
            temp_c: 9,
            dewpoint_c: 6,
            wind_dir_degrees: 150,
            wind_speed_kt: 3,
            wind_gust_kt: null,
            visibility_statute_mi: 10,
            altim_in_hg: 29.991142,
            auto: "TRUE",
            flight_category: "VFR",
            metar_type: "METAR",
            elevation_m: 186,
            ios_country: "US",
            ios_region: "US-VA",
            continent: "NA",
        },
        {
            raw_text: "K0V4 190555Z AUTO 15003KT 10SM CLR 09/06 A2999 RMK AO1",
            station_id: "K0V4",
            observation_time: "2023-04-19T05:55:00.000Z",
            latitude: "37.15",
            longitude: "-79.02",
            temp_c: 9,
            dewpoint_c: 6,
            wind_dir_degrees: 150,
            wind_speed_kt: 3,
            wind_gust_kt: null,
            visibility_statute_mi: 10,
            altim_in_hg: 29.991142,
            auto: "TRUE",
            flight_category: "VFR",
            metar_type: "METAR",
            elevation_m: 186,
            ios_country: "US",
            ios_region: "US-VA",
            continent: "NA",
        },
    ];

    const client = await awcMetarRepository();
    for (let obj of tempObj) {
        await client.createIndex();
        await client.createAndSave(obj);
    }
    const nodeClient = await redisNodeClient();
    // const doc = await client.setEx(JSON.parse(tempObj));
    // const metars = await repo.save(JSON.stringify(tempObj)); // TypeError: entity.toRedisJson is not a function
    // const metars = await repo.createAndSave(JSON.stringify(tempObj)); // all filed are null

    res.status(200).json({
        status: "success",
    });
};

module.exports.redisReset = async (req, res, next) => {
    const client = await redisNodeClient();
    client.flushAll("ASYNC", () => {
        console.log("flush all");
    });

    res.status(200).json({});
};
