const { AwcWeatherMetarModel, AwcWeatherMetarSchema } = require("../../models/weather/awcWeatherModel");
const NotFoundError = require("../../common/errors/NotFoundError");
const { downloadFile } = require("../../utils/AWC_Weather/download_weather");
const AwcWeather = require("../../utils/AWC_Weather/AwcWeather");
const mongoose = require("mongoose");
const fs = require("fs");
const { normalizeData } = require("../../utils/AWC_Weather/normalize_data");
require("dotenv").config({ path: "../../config.env" });

const awcWeather = new AwcWeather();

//!TODO: Refactor
module.exports.getWeatherForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { limit = 30 } = req.query;

    const sortedMetars = await AwcWeatherMetarModel.find({ ios_country: country.toUpperCase() }).limit(limit);
    if (!sortedMetars || sortedMetars.length === 0) {
        throw new NotFoundError(
            `Cannot find weather for country: ${country.toUpperCase()}. Please use correct country code.`
        );
    }

    res.status(200).json({
        status: "success",
        result: sortedMetars.length,
        data: {
            METAR: sortedMetars,
        },
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

//! DEV TESTING ONLY

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
                console.log("Old data deleted");
                console.log("Starting normalizing awc metars...");
                const normalizedMetar = await normalizeData();
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
