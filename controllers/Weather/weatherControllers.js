require("dotenv").config({ path: "../../config.env" });
const mongoose = require("mongoose");
const { downloadFile } = require("../../utils/AWC_Weather/download_weather");
const { normalizeData } = require("../../utils/AWC_Weather/normalize_data");
const { filterOutGlobalAirportsUsingGNS430_data } = require("../../utils/Data_Convert/gns430AirportFilter");
const { AwcWeatherMetarModel, AwcWeatherMetarSchema } = require("../../models/weather/awcWeatherModel");
const NotFoundError = require("../../common/errors/NotFoundError");
const { awcMetarRepository } = require("../../redis/awcMetar");
const { redisClient } = require("../../redis/client");
const { redisNodeClient } = require("../../redis/client");

module.exports.getWeatherForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { limit = 30 } = req.query;

    const sortedMetars = await AwcWeatherMetarModel.find({ ios_country: country.toUpperCase() }).limit(limit);

    res.status(200).json({
        status: "success",
        result: sortedMetars.length,
        data: sortedMetars,
    });
};

module.exports.getWindGustForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { limit = 10 } = req.query;
    const sortedMetars = await AwcWeatherMetarModel.find({
        ios_country: country.toUpperCase(),
        wind_gust_kt: { $ne: null },
    })
        .sort({ wind_gust_kt: -1 })
        .limit(limit);

    if (!sortedMetars || sortedMetars.length === 0) {
        throw new NotFoundError(`Cannot find wind gust data for country: ${country}`);
    }

    res.status(200).json({
        status: "success",
        result: sortedMetars.length,
        data: sortedMetars,
    });
};

module.exports.getWindMetarForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { limit = 10 } = req.query;

    const sortedMetars = await AwcWeatherMetarModel.find({
        ios_country: country.toUpperCase(),
        wind_speed_kt: { $ne: null },
    })
        .sort({ wind_speed_kt: -1 })
        .limit(limit);

    if (!sortedMetars || sortedMetars.length === 0) {
        throw new NotFoundError(`Cannot find wind gust data for country: ${country}`);
    }

    res.status(200).json({
        status: "success",
        result: sortedMetars.length,
        data: sortedMetars,
    });
};

module.exports.getBaroMetarForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { sort = 1, limit = 10 } = req.query; // 1 would sort low baro to high

    const sortedMetars = await AwcWeatherMetarModel.find({
        ios_country: country.toUpperCase(),
        altim_in_hg: { $ne: null },
    })
        .sort({ altim_in_hg: sort })
        .limit(limit);

    if (!sortedMetars || sortedMetars.length === 0) {
        throw new NotFoundError(`Cannot find baro data for country: ${country}`);
    }

    res.status(200).json({
        status: "success",
        result: sortedMetars.length,
        data: sortedMetars,
    });
};

module.exports.getVisibilityMetarForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { sort = 1, limit = 10 } = req.query; //1 would sort bad visibility from good

    const sortedMetars = await AwcWeatherMetarModel.find({
        ios_country: country.toUpperCase(),
        visibility_statute_mi: { $ne: null },
    })
        .sort({ visibility_statute_mi: sort })
        .limit(limit);

    if (!sortedMetars || sortedMetars.length === 0) {
        throw new NotFoundError(`Cannot find visibility data for country: ${country}`);
    }

    res.status(200).json({
        status: "success",
        result: sortedMetars.length,
        data: sortedMetars,
    });
};

module.exports.getTempMetarForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { sort = 1, limit = 10 } = req.query; //1 would sort temp from low to high

    const sortedMetars = await AwcWeatherMetarModel.find({
        ios_country: country.toUpperCase(),
        temp_c: { $ne: null },
    })
        .sort({ temp_c: sort })
        .limit(limit);

    if (!sortedMetars || sortedMetars.length === 0) {
        throw new NotFoundError(`Cannot find temperature data for country: ${country}`);
    }

    res.status(200).json({
        status: "success",
        result: sortedMetars.length,
        data: sortedMetars,
    });
};

//continent
module.exports.getMetarForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { limit } = req.query;
    const sortedMetars = await AwcWeatherMetarModel.find({ continent: continent.toUpperCase() }).limit(limit);

    if (!sortedMetars || sortedMetars.length === 0) {
        throw new NotFoundError(
            `Can not find METARs for continent: ${continent}. Please use the correct continent code.`
        );
    }

    res.status(200).json({
        status: "success",
        result: sortedMetars.length,
        data: sortedMetars,
    });
};

module.exports.getWindGustForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { limit = 10 } = req.query; //1 would sort temp from low to high

    const sortedMetars = await AwcWeatherMetarModel.find({
        continent: continent.toUpperCase(),
        wind_gust_kt: { $ne: null },
    })
        .sort({ wind_gust_kt: -1 })
        .limit(limit);

    if (!sortedMetars || sortedMetars.length === 0) {
        throw new NotFoundError(`Cannot find wind gust data for continent: ${continent}
            Please use code: AF, AN, AS, OC, EU, NA, SA`);
    }

    res.status(200).json({
        status: "success",
        result: sortedMetars.length,
        data: sortedMetars,
    });
};

module.exports.getWindMetarForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { limit = 10 } = req.query; //1 would sort temp from low to high

    const sortedMetars = await AwcWeatherMetarModel.find({
        continent: continent.toUpperCase(),
        wind_speed_kt: { $ne: null },
    })
        .sort({ wind_speed_kt: -1 })
        .limit(limit);

    if (!sortedMetars || sortedMetars.length === 0) {
        throw new NotFoundError(
            `Cannot find wind speed data for continent: ${continent}
            Please use code: AF, AN, AS, OC, EU, NA, SA`
        );
    }

    res.status(200).json({
        status: "success",
        result: sortedMetars.length,
        data: sortedMetars,
    });
};

module.exports.getBaroMetarForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { sort = 1, limit = 10 } = req.query; //1 would sort baro from low to high

    const sortedMetars = await AwcWeatherMetarModel.find({
        continent: continent.toUpperCase(),
        altim_in_hg: { $ne: null },
    })
        .sort({ altim_in_hg: sort })
        .limit(limit);

    if (!sortedMetars || sortedMetars.length === 0) {
        throw new NotFoundError(
            `Cannot find bara data for continent: ${continent}
            Please use code: AF, AN, AS, OC, EU, NA, SA`
        );
    }

    res.status(200).json({
        status: "success",
        result: sortedMetars.length,
        data: sortedMetars,
    });
};

module.exports.getVisibilityMetarForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { sort = 1, limit = 10 } = req.query; //1 would sort visibility from low to high

    const sortedMetars = await AwcWeatherMetarModel.find({
        continent: continent.toUpperCase(),
        visibility_statute_mi: { $ne: null },
    })
        .sort({ visibility_statute_mi: sort })
        .limit(limit);

    if (!sortedMetars || sortedMetars.length === 0) {
        throw new NotFoundError(
            `Cannot find visibility data for continent: ${continent}
            Please use code: AF, AN, AS, OC, EU, NA, SA`
        );
    }

    res.status(200).json({
        status: "success",
        result: sortedMetars.length,
        data: sortedMetars,
    });
};

module.exports.getTempMetarForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { sort = 1, limit = 10 } = req.query; //1 would sort temperature from low to high

    const sortedMetars = await AwcWeatherMetarModel.find({
        continent: continent.toUpperCase(),
        temp_c: { $ne: null },
    })
        .sort({ temp_c: sort })
        .limit(limit);

    if (!sortedMetars || sortedMetars.length === 0) {
        throw new NotFoundError(
            `Cannot find temperature data for continent: ${continent}
            Please use code: AF, AN, AS, OC, EU, NA, SA`
        );
    }

    res.status(200).json({
        status: "success",
        result: sortedMetars.length,
        data: sortedMetars,
    });
};

// Global

module.exports.getWindGustForGlobal = async (req, res, next) => {
    const { limit = 10 } = req.query;

    const sortedMetars = await AwcWeatherMetarModel.find({
        wind_gust_kt: { $ne: null },
    })
        .sort({ wind_gust_kt: -1 })
        .limit(limit);

    if (!sortedMetars || sortedMetars.length === 0) {
        throw new NotFoundError(`Cannot find global temperature data.`);
    }

    res.status(200).json({
        status: "success",
        result: sortedMetars.length,
        data: sortedMetars,
    });
};

module.exports.getWindMetarForGlobal = async (req, res, next) => {
    const { limit = 10 } = req.query;

    const sortedMetars = await AwcWeatherMetarModel.find({
        wind_speed_kt: { $ne: null },
    })
        .sort({ wind_speed_kt: -1 })
        .limit(limit);

    if (!sortedMetars || sortedMetars.length === 0) {
        throw new NotFoundError(`Cannot find global temperature data.`);
    }

    res.status(200).json({
        status: "success",
        result: sortedMetars.length,
        data: sortedMetars,
    });
};

module.exports.getBaroMetarForGlobal = async (req, res, next) => {
    const { sort = 1, limit = 10 } = req.query;

    const sortedMetars = await AwcWeatherMetarModel.find({
        altim_in_hg: { $ne: null },
    })
        .sort({ altim_in_hg: sort })
        .limit(limit);

    if (!sortedMetars || sortedMetars.length === 0) {
        throw new NotFoundError(`Cannot find global baro data.`);
    }

    res.status(200).json({
        status: "success",
        result: sortedMetars.length,
        data: sortedMetars,
    });
};

module.exports.getVisibilityMetarForGlobal = async (req, res, next) => {
    const { sort = 1, limit = 10 } = req.query;

    const sortedMetars = await AwcWeatherMetarModel.find({
        visibility_statute_mi: { $ne: null },
    })
        .sort({ visibility_statute_mi: sort })
        .limit(limit);

    if (!sortedMetars || sortedMetars.length === 0) {
        throw new NotFoundError(`Cannot find global visibility data.`);
    }

    res.status(200).json({
        status: "success",
        result: sortedMetars.length,
        data: sortedMetars,
    });
};

module.exports.getTempMetarForGlobal = async (req, res, next) => {
    const { sort = 1, limit = 10 } = req.query;

    const sortedMetars = await AwcWeatherMetarModel.find({
        temp_c: { $ne: null },
    })
        .sort({ temp_c: sort })
        .limit(limit);

    if (!sortedMetars || sortedMetars.length === 0) {
        throw new NotFoundError(`Cannot find global temperature data.`);
    }

    res.status(200).json({
        status: "success",
        result: sortedMetars.length,
        data: sortedMetars,
    });
};

//! DEV TESTING ONLY

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
            const awcMetars = await downloadFile(
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
            const conn = mongoose.createConnection(`${process.env.DATABASE}`);
            const AwcWeatherModel = conn.model("AwcWeatherMetarModel_Latest", AwcWeatherMetarSchema);
            console.log("start downloading data from AWC...");
            const awcMetars = await downloadFile(
                "https://www.aviationweather.gov/adds/dataserver_current/current/metars.cache.csv"
            );
            if (awcMetars.length && awcMetars.length > 0) {
                console.log("Download Finished, data length:", awcMetars.length);
                console.log("Deleting old data...");
                await AwcWeatherModel.deleteMany({});
                console.log("Clear redis cache...");
                const redisNode = await redisNodeClient();
                redisNode.flushAll("ASYNC", () => {
                    console.log("Redis cache flushed");
                });
                console.log("Old data deleted");
                console.log("Starting normalizing awc metars...");
                const normalizedMetar = await normalizeData();

                console.log("store normalized metar into redis");
                const client = await awcMetarRepository();
                await client.createIndex();

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
                        await client.createAndSave(updatedMetar);
                    })
                );

                console.log("Start importing data to Database...");
                const docs = await AwcWeatherModel.create(JSON.parse(normalizedMetar));
                console.log("Data imported, total entries:", docs.length);
                console.log("Copy all data to Model...");
                await AwcWeatherModel.aggregate([{ $out: "awcweathermetarmodels" }]);
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
        data: JSON.parse(docs),
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
