// noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
require("dotenv").config({ path: "../../config.env" });
const { AwcWeatherMetarModel } = require("../../models/weather/awcWeatherModel");
const NotFoundError = require("../../common/errors/NotFoundError");
const { awcMetarSchema } = require("../../redis/awcMetar");
const { checkICAO } = require("../../utils/checkICAO");
const { Airports } = require("../../models/airports/airportsModel");
const BadRequestError = require("../../common/errors/BadRequestError");
const RedisClient = require("../../redis/RedisClient");
const MetarFeatures = require("../METAR/MetarFeatures");
const { distanceConverter } = require("../../utils/METAR/convert");
const {
    getAwcMetarUsingICAO,
    getAwcMetarUsingGenericInput,
    getAwcMetarUsingAirportName,
} = require("../../utils/AWC_Weather/controller_helper");

const rClient = new RedisClient();
let repo;
(async () => {
    await rClient.openNewRedisOMClient(process.env.REDISCLOUD_URL);
    repo = rClient.createRedisOMRepository(awcMetarSchema);
})();

const getMetarsWithin = async (req, res, next) => {
    const { icao } = req.params;
    //unit: miles, meters, kilometers
    const { distance, unit } = req.query;
    let decode = req.query.decode === "true";
    const newDistance = distanceConverter(unit, distance);

    if (checkICAO(icao.toUpperCase())) {
        const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
        const responseMetars = await metarFeatures.requestMetarWithinRadius_icao(icao, newDistance, decode);

        if (responseMetars && responseMetars.length > 0) {
            res.status(200).json({
                results: responseMetars.length,
                data: responseMetars,
            });
        } else {
            res.status(404).json({
                results: responseMetars.length,
                data: responseMetars,
            });
        }
    } else {
        throw new NotFoundError("Please provide correct ICAO code");
    }
};

const getMetarUsingGenericInput = async (req, res, next) => {
    const { data } = req.params;
    let decode = req.query.decode === "true";

    if (checkICAO(data)) {
        const responseMetar = await getAwcMetarUsingICAO(data, decode, AwcWeatherMetarModel, repo);
        if (responseMetar) {
            return res.status(200).json({
                results: 1,
                data: [responseMetar],
            });
        } else {
            return res.status(404).json({
                results: 0,
                data: [],
            });
        }
    } else {
        const responseMetar = await getAwcMetarUsingGenericInput(data, decode, AwcWeatherMetarModel, repo);
        if (responseMetar && responseMetar.length > 0) {
            return res.status(200).json({
                results: responseMetar.length,
                data: responseMetar,
            });
        } else {
            return res.status(404).json({
                results: 0,
                data: [],
            });
        }
    }
};

const getMetarUsingAirportName = async (req, res, next) => {
    const { name } = req.params;
    let decode = req.query.decode === "true";
    const responseMetar = await getAwcMetarUsingAirportName(name, decode, AwcWeatherMetarModel, repo);
    if (responseMetar && responseMetar.length > 0) {
        res.status(200).json({
            results: responseMetar.length,
            data: responseMetar,
        });
    } else {
        res.status(404).json({
            results: 0,
            data: [],
        });
    }
};

const getMetarUsingICAO = async (req, res, next) => {
    const { ICAO } = req.params;
    let decode = req.query.decode === "true";

    if (checkICAO(ICAO)) {
        const responseMetar = await getAwcMetarUsingICAO(ICAO, decode);
        if (responseMetar) {
            res.status(200).json({
                results: 1,
                data: [responseMetar],
            });
        } else {
            res.status(404).json({
                results: 0,
                data: [],
            });
        }
    } else {
        throw new NotFoundError("Please provide correct ICAO code");
    }
};

const getMetarUsingIATA = async (req, res, next) => {
    const { IATA } = req.params;
    const airportICAO = await Airports.find({
        iata_code: IATA.toUpperCase(),
    });

    if (!airportICAO || airportICAO.length === 0) {
        throw new BadRequestError(
            `Airport with IATA: '${IATA.toUpperCase()}' Not Found ${IATA.length > 3 ? "(IATA code length is 3)" : ""}`
        );
    }

    const airportICAO_Code = airportICAO[0].ident;

    const responseMetar = await getAwcMetarUsingICAO(airportICAO_Code.toUpperCase());

    res.status(200).json({
        status: "success",
        data: responseMetar,
    });
};

const getWindGustForCountry = async (req, res) => {
    const { country } = req.params;
    const { limit = 10 } = req.query;
    let decode = req.query.decode === "true";

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarCategory_local(
        "ios_country",
        country,
        "wind_gust_kt",
        -1,
        limit,
        decode
    );
    if (response && response.length > 0) {
        return res.status(200).json({
            results: response.length,
            data: response,
        });
    } else {
        return res.status(404).json({
            results: 0,
            data: [],
        });
    }
};

const getWindMetarForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { limit = 10 } = req.query;

    let decode = req.query.decode === "true";
    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarCategory_local(
        "ios_country",
        country,
        "wind_speed_kt",
        -1,
        limit,
        decode
    );

    if (response && response.length > 0) {
        return res.status(200).json({
            results: response.length,
            data: response,
        });
    } else {
        return res.status(404).json({
            results: 0,
            data: [],
        });
    }
};

const getBaroMetarForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { sort = 1, limit = 10 } = req.query; // 1 would sort low baro to high

    let decode = req.query.decode === "true";
    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarCategory_local(
        "ios_country",
        country,
        "altim_in_hg",
        sort,
        limit,
        decode
    );

    if (response && response.length > 0) {
        return res.status(200).json({
            results: response.length,
            data: response,
        });
    } else {
        return res.status(404).json({
            results: 0,
            data: [],
        });
    }
};

const getVisibilityMetarForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { sort = 1, limit = 10 } = req.query; //1 would sort bad/low visibility from good
    let decode = req.query.decode === "true";
    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarCategory_local(
        "ios_country",
        country,
        "visibility_statute_mi",
        sort,
        limit,
        decode
    );

    if (response && response.length > 0) {
        return res.status(200).json({
            results: response.length,
            data: response,
        });
    } else {
        return res.status(404).json({
            results: 0,
            data: [],
        });
    }
};

const getTempMetarForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { sort = 1, limit = 10 } = req.query; //1 would sort temp from low to high

    let decode = req.query.decode === "true";
    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarCategory_local(
        "ios_country",
        country,
        "temp_c",
        sort,
        limit,
        decode
    );

    if (response && response.length > 0) {
        return res.status(200).json({
            results: response.length,
            data: response,
        });
    } else {
        return res.status(404).json({
            results: 0,
            data: [],
        });
    }
};

const getWindGustForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { limit = 10 } = req.query;
    let decode = req.query.decode === "true";

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarCategory_local(
        "continent",
        continent,
        "wind_gust_kt",
        -1,
        limit,
        decode
    );

    if (response && response.length > 0) {
        return res.status(200).json({
            results: response.length,
            data: response,
        });
    } else {
        return res.status(404).json({
            results: 0,
            data: [],
        });
    }
};

const getWindMetarForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { limit = 10 } = req.query;

    let decode = req.query.decode === "true";
    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarCategory_local(
        "continent",
        continent,
        "wind_speed_kt",
        -1,
        limit,
        decode
    );

    if (response && response.length > 0) {
        return res.status(200).json({
            results: response.length,
            data: response,
        });
    } else {
        return res.status(404).json({
            results: 0,
            data: [],
        });
    }
};

const getBaroMetarForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { sort = 1, limit = 10 } = req.query; //1 would sort baro from low to high
    const decode = req.query.decode === "true";

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarCategory_local(
        "continent",
        continent,
        "altim_in_hg",
        sort,
        limit,
        decode
    );

    if (response && response.length > 0) {
        return res.status(200).json({
            results: response.length,
            data: response,
        });
    } else {
        return res.status(404).json({
            results: 0,
            data: [],
        });
    }
};

const getVisibilityMetarForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { sort = 1, limit = 10 } = req.query; //1 would sort visibility from low to high

    const decode = req.query.decode === "true";

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarCategory_local(
        "continent",
        continent,
        "visibility_statute_mi",
        sort,
        limit,
        decode
    );

    if (response && response.length > 0) {
        return res.status(200).json({
            results: response.length,
            data: response,
        });
    } else {
        return res.status(404).json({
            results: 0,
            data: [],
        });
    }
};

const getTempMetarForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { sort = 1, limit = 10 } = req.query; //1 would sort temperature from low to high

    const decode = req.query.decode === "true";

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarCategory_local(
        "continent",
        continent,
        "temp_c",
        sort,
        limit,
        decode
    );

    if (response && response.length > 0) {
        return res.status(200).json({
            results: response.length,
            data: response,
        });
    } else {
        return res.status(404).json({
            results: 0,
            data: [],
        });
    }
};

// Global

const getWindGustForGlobal = async (req, res, next) => {
    const { limit = 10 } = req.query;
    let decode = req.query.decode === "true";

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarCategory_global("wind_gust_speed", -1, limit, decode);
    if (response && response.length > 0) {
        return res.status(200).json({
            results: response.length,
            data: response,
        });
    } else {
        return res.status(404).json({
            results: 0,
            data: [],
        });
    }
};

const getWindMetarForGlobal = async (req, res, next) => {
    const { limit = 10 } = req.query;
    let decode = req.query.decode === "true";

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarCategory_global("wind_speed_kt", -1, limit, decode);

    if (response && response.length > 0) {
        return res.status(200).json({
            results: response.length,
            data: response,
        });
    } else {
        return res.status(404).json({
            results: 0,
            data: [],
        });
    }
};

const getBaroMetarForGlobal = async (req, res, next) => {
    const { sort = 1, limit = 10 } = req.query;
    let decode = req.query.decode === "true";

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarCategory_global("altim_in_hg", sort, limit, decode);

    if (response && response.length > 0) {
        return res.status(200).json({
            results: response.length,
            data: response,
        });
    } else {
        return res.status(404).json({
            results: 0,
            data: [],
        });
    }
};

const getVisibilityMetarForGlobal = async (req, res, next) => {
    const { sort = 1, limit = 10 } = req.query;
    let decode = req.query.decode === "true";

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarCategory_global("visibility_statute_mi", sort, limit, decode);

    if (response && response.length > 0) {
        return res.status(200).json({
            results: response.length,
            data: response,
        });
    } else {
        return res.status(404).json({
            results: 0,
            data: [],
        });
    }
};

const getTempMetarForGlobal = async (req, res, next) => {
    const { sort = 1, limit = 10 } = req.query; //default sort: low temp to high

    let decode = req.query.decode === "true";

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarCategory_global("temp_c", sort, limit, decode);

    if (response && response.length > 0) {
        return res.status(200).json({
            results: response.length,
            data: response,
        });
    } else {
        return res.status(404).json({
            results: 0,
            data: [],
        });
    }
};

module.exports = {
    getMetarsWithin,
    getMetarUsingGenericInput,
    getMetarUsingAirportName,
    getMetarUsingICAO,
    getTempMetarForGlobal,
    getMetarUsingIATA,
    getWindGustForCountry,
    getWindMetarForCountry,
    getBaroMetarForCountry,
    getVisibilityMetarForCountry,
    getTempMetarForCountry,
    getWindGustForContinent,
    getWindMetarForContinent,
    getBaroMetarForContinent,
    getVisibilityMetarForContinent,
    getTempMetarForContinent,
    getWindGustForGlobal,
    getWindMetarForGlobal,
    getBaroMetarForGlobal,
    getVisibilityMetarForGlobal,
};
