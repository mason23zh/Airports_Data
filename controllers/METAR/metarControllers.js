// noinspection JSUnresolvedVariable,JSCheckFunctionSignatures

require("dotenv").config({ path: "../../config.env" });
const { AwcWeatherMetarModel } = require("../../models/weather/awcWeatherModel");
const { awcMetarSchema } = require("../../redis/awcMetar");
const MetarFeatures = require("./MetarFeatures");
const RedisClient = require("../../redis/RedisClient");
const CustomError = require("../../common/errors/custom-error");
const { distanceConverter } = require("../../utils/METAR/convert");
const rClient = new RedisClient();

let repo;
(async () => {
    await rClient.openNewRedisOMClient(process.env.REDIS_URL);
    repo = rClient.createRedisOMRepository(awcMetarSchema);
})();
//! NEED TO ADD DEFAULT DISTANCE
module.exports.getMetar = async (req, res) => {
    const { decode } = req.query;
    const icaoArray = req.params.icao.split(",");
    const uniqIcaoArray = [...new Set(icaoArray)];
    let responseMetarArray = [];

    if (uniqIcaoArray.length > 30) {
        throw new CustomError("Maximum number of icao reached. Limited to 30.", 429);
    }

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
            data: responseMetarArray,
        });
    } else {
        res.status(404).json({
            results: responseMetarArray.length,
            data: responseMetarArray,
        });
    }
};

module.exports.getRadiusMetar = async (req, res) => {
    const { icao } = req.params;
    const { distance, unit = "mile" } = req.query;
    let decode = req.query.decode === "true";
    const newDistance = distanceConverter(unit, distance);

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarWithinRadius_icao(icao, newDistance, decode);

    if (response.length > 0) {
        res.status(200).json({
            results: response.length,
            data: response,
        });
    } else {
        res.status(404).json({
            results: response.length,
            data: response,
        });
    }
};

module.exports.getRadiusMetarWithLngLat = async (req, res) => {
    const coordinates = req.params.coordinates.split(",");
    const { distance, unit = "mile" } = req.query;
    let decode = req.query.decode === "true";
    const lng = Number(coordinates[0]) || null;
    const lat = Number(coordinates[1]) || null;
    const newDistance = distanceConverter(unit, distance);

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarWithinRadius_LngLat(lng, lat, newDistance, decode);

    if (response.length > 0) {
        res.status(200).json({
            results: response.length,
            data: response,
        });
    } else {
        res.status(404).json({
            results: response.length,
            data: response,
        });
    }
};

module.exports.getNearestMetar_icao = async (req, res) => {
    const { icao } = req.params;
    let decode = req.query.decode === "true";
    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestNearestMetar_icao(icao, decode);
    if (response.length !== 0) {
        res.status(200).json({
            results: response.length,
            data: response,
        });
    } else {
        res.status(404).json({
            results: response.length,
            data: response,
        });
    }
};

module.exports.getNearestMetar_LngLat = async (req, res) => {
    const { coordinates } = req.params;
    let decode = req.query.decode === "true";
    const [lon, lat] = coordinates.split(",");
    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestNearestMetar_LngLat(lon, lat, decode);

    if (response.length !== 0) {
        res.status(200).json({
            results: response.length,
            data: response,
        });
    } else {
        res.status(404).json({
            results: response.length,
            data: response,
        });
    }
};
