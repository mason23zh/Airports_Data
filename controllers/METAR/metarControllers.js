// noinspection JSUnresolvedVariable,JSCheckFunctionSignatures

require("dotenv").config({ path: "../../config.env" });
const { AwcWeatherMetarModel } = require("../../models/weather/awcWeatherModel");
const { awcMetarSchema } = require("../../redis/awcMetar");
const MetarFeatures = require("./MetarFeatures");
const RedisClient = require("../../redis/RedisClient");
const CustomError = require("../../common/errors/custom-error");
const { distanceConverter } = require("../../utils/METAR/convert");
const rClient = new RedisClient();
const {
    downloadAndUnzip,
    processDownloadAWCData
} = require("../../utils/AWC_Weather/download_weather");
const { normalizeData } = require("../../utils/AWC_Weather/normalize_data");

(async () => {
    await rClient.createRedisNodeConnection(process.env.REDISCLOUD_METAR_URL);
})();

module.exports.getMetar = async (req, res) => {
    const { decode = "false" } = req.query;

    const icaoArray = req.params.icao.split(",");
    const uniqIcaoArray = [...new Set(icaoArray)];
    let responseMetarArray = [];

    if (uniqIcaoArray.length > 30) {
        throw new CustomError("Maximum number of icao reached. Limited to 30.", 429);
    }

    let repo = rClient.createRedisRepository(awcMetarSchema);
    await Promise.all(
        uniqIcaoArray.map(async (icao) => {
            const metarFeature = new MetarFeatures(AwcWeatherMetarModel, repo);
            const metar = await metarFeature.requestMetarUsingICAO(icao);
            if (decode === "true" && metar) {
                const decodedMetar = metar.getDecodedMetar();
                if (decodedMetar && Object.keys(decodedMetar).length !== 0) {
                    responseMetarArray.push(decodedMetar);
                }
            }
            if (decode === "false" && metar) {
                const rawMetar = metar.getRawMetar();
                if (rawMetar && Object.keys(rawMetar).length !== 0) {
                    responseMetarArray.push(metar.getRawMetar());
                }
            }
        })
    );

    if (responseMetarArray.length > 0) {
        res.status(200).json({
            results: responseMetarArray.length,
            data: responseMetarArray
        });
    } else {
        res.status(404).json({
            results: responseMetarArray.length,
            data: responseMetarArray
        });
    }
};

module.exports.getRadiusMetar = async (req, res) => {
    const { icao } = req.params;
    const { distance = 50, unit = "mile" } = req.query;
    let decode = req.query.decode === "true";
    const newDistance = distanceConverter(unit, distance);
    const repo = rClient.createRedisRepository(awcMetarSchema);

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarWithinRadius_icao(icao, newDistance, decode);

    if (response.length > 0) {
        res.status(200).json({
            results: response.length,
            data: response
        });
    } else {
        res.status(404).json({
            results: response.length,
            data: response
        });
    }
};

module.exports.getRadiusMetarWithLngLat = async (req, res) => {
    const coordinates = req.params.coordinates.split(",");
    const { distance = 50, unit = "mile" } = req.query;
    let decode = req.query.decode === "true";
    const lng = Number(coordinates[0]) || null;
    const lat = Number(coordinates[1]) || null;
    const newDistance = distanceConverter(unit, distance);
    const repo = rClient.createRedisRepository(awcMetarSchema);

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarWithinRadius_LngLat(
        lng,
        lat,
        newDistance,
        decode
    );

    if (response.length > 0) {
        res.status(200).json({
            results: response.length,
            data: response
        });
    } else {
        res.status(404).json({
            results: response.length,
            data: response
        });
    }
};

module.exports.getNearestMetar_icao = async (req, res) => {
    const { icao } = req.params;
    let decode = req.query.decode === "true";
    const repo = rClient.createRedisRepository(awcMetarSchema);

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestNearestMetar_icao(icao, decode);
    if (response.length !== 0) {
        res.status(200).json({
            results: response.length,
            data: response
        });
    } else {
        res.status(404).json({
            results: response.length,
            data: response
        });
    }
};

module.exports.getNearestMetar_LngLat = async (req, res) => {
    const { coordinates } = req.params;
    let decode = req.query.decode === "true";
    const [lon, lat] = coordinates.split(",");
    const repo = rClient.createRedisRepository(awcMetarSchema);

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestNearestMetar_LngLat(lon, lat, decode);

    if (response.length !== 0) {
        res.status(200).json({
            results: response.length,
            data: response
        });
    } else {
        res.status(404).json({
            results: response.length,
            data: response
        });
    }
};

module.exports.getMetarUsingAirportName = async (req, res) => {
    const { name = "" } = req.params;
    let decode = req.query.decode === "true";
    const repo = rClient.createRedisRepository(awcMetarSchema);

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    if (name.length === 0) {
        return res.status(404).json({
            results: 0,
            data: []
        });
    }
    const response = await metarFeatures.requestMetarUsingAirportName(name, decode);
    if (response.length !== 0) {
        return res.status(200).json({
            results: response.length,
            data: response
        });
    } else {
        return res.status(404).json({
            results: response.length,
            data: response
        });
    }
};

module.exports.getMetarUsingGenericInput = async (req, res) => {
    const { data = "" } = req.params;
    let decode = req.query.decode === "true";
    const repo = rClient.createRedisRepository(awcMetarSchema);

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    if (data.length === 0) {
        return res.status(200).json({
            results: 0,
            data: []
        });
    }
    const response = await metarFeatures.requestMetarUsingGenericInput(data, decode);
    if (response.length !== 0) {
        return res.status(200).json({
            results: response.length,
            data: response
        });
    } else {
        return res.status(200).json({
            results: 0,
            data: []
        });
    }
};

module.exports.testDbImport = async (req, res) => {
    try {
        await downloadAndUnzip("https://aviationweather.gov/data/cache/metars.cache.csv.gz");
        await processDownloadAWCData();
        const normalizedMetar = await normalizeData();
        console.log(typeof normalizedMetar);
        console.log(normalizedMetar.length);
        res.status(200).json({
            data: normalizedMetar
        });
    } catch (e) {
        res.status(500);
    }
};
