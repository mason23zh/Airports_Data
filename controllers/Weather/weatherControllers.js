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
const CustomError = require("../../common/errors/custom-error");
const { distanceConverter } = require("../../utils/METAR/convert");

const rClient = new RedisClient();
let repo;
(async () => {
    await rClient.openNewRedisOMClient(process.env.REDIS_URL);
    repo = rClient.createRedisOMRepository(awcMetarSchema);
})();

module.exports.getAwcMetarUsingICAO = async (icao, decode) => {
    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    try {
        const metar = await metarFeatures.requestMetarUsingICAO(icao);
        if (metar) {
            if (decode === true) {
                return metar.getDecodedMetar();
            } else {
                return metar.getRawMetar();
            }
        } else {
            return null;
        }
    } catch (e) {
        throw new CustomError("Something went wrong, please try again later", 500);
    }
};

module.exports.getAwcMetarUsingGenericInput = async (data, decode) => {
    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    try {
        return await metarFeatures.requestMetarUsingGenericInput(data, decode);
    } catch (e) {
        throw new CustomError("Something went wrong, please try again later", 500);
    }
};

module.exports.getAwcMetarUsingAirportName = async (name, decode) => {
    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    try {
        return await metarFeatures.requestMetarUsingAirportName(name, decode);
    } catch (e) {
        throw new CustomError("Something went wrong, please try again later", 500);
    }
};

module.exports.getMetarsWithin = async (req, res, next) => {
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
        throw new NotFoundError("Please provide correct ICAO code.");
    }
};

module.exports.getMetarUsingGenericInput = async (req, res, next) => {
    const { data } = req.params;
    let decode = req.query.decode === "true";

    if (checkICAO(data)) {
        const responseMetar = await this.getAwcMetarUsingICAO(data, decode);
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
        const responseMetar = await this.getAwcMetarUsingGenericInput(data, decode);
        if (responseMetar && responseMetar.length > 0) {
            return res.status(200).json({
                results: responseMetar.length,
                data: responseMetar,
            });
        } else {
            return res.status(404).json({
                results: responseMetar.length,
                data: responseMetar,
            });
        }
    }
};

module.exports.getMetarUsingAirportName = async (req, res, next) => {
    const { name } = req.params;
    let decode = req.query.decode === "true";
    const responseMetar = await this.getAwcMetarUsingAirportName(name, decode);
    if (responseMetar && responseMetar.length > 0) {
        res.status(200).json({
            results: responseMetar.length,
            data: responseMetar,
        });
    } else {
        res.status(404).json({
            results: responseMetar.length,
            data: responseMetar,
        });
    }
};

module.exports.getMetarUsingICAO = async (req, res, next) => {
    const { ICAO } = req.params;
    let decode = req.query.decode === "true";

    if (checkICAO(ICAO)) {
        const responseMetar = await this.getAwcMetarUsingICAO(ICAO, decode);
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

module.exports.getMetarUsingIATA = async (req, res, next) => {
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

    const responseMetar = await this.getAwcMetarUsingICAO(airportICAO_Code.toUpperCase());

    res.status(200).json({
        status: "success",
        data: responseMetar,
    });
};

module.exports.getWeatherForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { limit = 30 } = req.query;

    const sortedMetars = await repo
        ?.search()
        .where("ios_country")
        .equals(country.toUpperCase())
        .returnPage(0, Number(limit));

    if (sortedMetars && sortedMetars.length !== 0) {
        return res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    } else {
        const sortedMetars = await AwcWeatherMetarModel.find({ ios_country: country.toUpperCase() }).limit(limit);

        if (!sortedMetars || sortedMetars.length === 0) {
            throw new NotFoundError(`Cannot find METARs data for country: ${country}`);
        }

        res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    }
};

module.exports.getWindGustForCountry = async (req, res, next) => {
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
    res.status(200).json({
        status: "success",
        result: response.length,
        data: response,
    });
};

module.exports.getWindMetarForCountry = async (req, res, next) => {
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

    res.status(200).json({
        status: "success",
        results: response.length,
        data: response,
    });
};

module.exports.getBaroMetarForCountry = async (req, res, next) => {
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

    res.status(200).json({
        status: "success",
        result: response.length,
        data: response,
    });
};

module.exports.getVisibilityMetarForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { sort = 1, limit = 10 } = req.query; //1 would sort bad visibility from good
    //const repo = await awcMetarRepository();
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

    res.status(200).json({
        status: "success",
        result: response.length,
        data: response,
    });
};

module.exports.getTempMetarForCountry = async (req, res, next) => {
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

    res.status(200).json({
        status: "success",
        result: response.length,
        data: response,
    });
};

//continent
module.exports.getMetarForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { limit = 10 } = req.query;
    //const repo = await awcMetarRepository();

    const sortedMetars = await repo
        ?.search()
        .where("continent")
        .equals(continent.toUpperCase())
        .returnPage(0, Number(limit));

    if (sortedMetars && sortedMetars.length !== 0) {
        return res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    } else {
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
    }
};

module.exports.getWindGustForContinent = async (req, res, next) => {
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

    res.status(200).json({
        status: "success",
        result: response.length,
        data: response,
    });
};

module.exports.getWindMetarForContinent = async (req, res, next) => {
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

    res.status(200).json({
        status: "success",
        results: response.length,
        data: response,
    });
};

module.exports.getBaroMetarForContinent = async (req, res, next) => {
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

    res.status(200).json({
        status: "success",
        data: response,
    });
};

module.exports.getVisibilityMetarForContinent = async (req, res, next) => {
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

    res.status(200).json({
        status: "success",
        data: response,
    });
};

module.exports.getTempMetarForContinent = async (req, res, next) => {
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

    res.status(200).json({
        status: "success",
        data: response,
    });
};

// Global

module.exports.getWindGustForGlobal = async (req, res, next) => {
    const { limit = 10 } = req.query;
    let decode = req.query.decode === "true";

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestWindGustMetar_global(limit, decode);
    res.status(200).json({
        status: "success",
        result: response.length,
        data: response,
    });
};

module.exports.getWindMetarForGlobal = async (req, res, next) => {
    const { limit = 10 } = req.query;
    let decode = req.query.decode === "true";

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarCategory_global("wind_speed_kt", -1, limit, decode);

    res.status(200).json({
        status: "success",
        result: response.length,
        data: response,
    });
};

module.exports.getBaroMetarForGlobal = async (req, res, next) => {
    const { sort = 1, limit = 10 } = req.query;
    let decode = req.query.decode === "true";

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarCategory_global("altim_in_hg", sort, limit, decode);

    res.status(200).json({
        status: "success",
        result: response.length,
        data: response,
    });
};

module.exports.getVisibilityMetarForGlobal = async (req, res, next) => {
    const { sort = 1, limit = 10 } = req.query;
    let decode = req.query.decode === "true";

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarCategory_global("visibility_statute_mi", sort, limit, decode);

    res.status(200).json({
        status: "success",
        result: response.length,
        data: response,
    });
};

module.exports.getTempMetarForGlobal = async (req, res, next) => {
    const { sort = 1, limit = 10 } = req.query; //default sort: low temp to high

    let decode = req.query.decode === "true";

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarCategory_global("temp_c", sort, limit, decode);

    res.status(200).json({
        status: "success",
        result: response.length,
        data: response,
    });
};
