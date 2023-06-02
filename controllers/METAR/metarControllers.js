/* eslint-disable no-constant-condition */
// noinspection JSUnresolvedVariable,JSCheckFunctionSignatures

require("dotenv").config({ path: "../../config.env" });
const { AwcWeatherMetarModel } = require("../../models/weather/awcWeatherModel");
const { awcMetarSchema } = require("../../redis/awcMetar");
const MetarFeatures = require("./MetarFeatures");
const RedisClient = require("../../redis/RedisClient");
const CustomError = require("../../common/errors/custom-error");
const rClient = new RedisClient();

let repo;
(async () => {
    await rClient.openNewRedisOMClient(process.env.REDIS_URL);
    repo = rClient.createRedisOMRepository(awcMetarSchema);
})();

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

    res.status(200).json({
        status: "success",
        results: responseMetarArray.length,
        data: responseMetarArray,
    });
};

const distanceConverter = (unit, distance) => {
    let newDistance;
    if (unit.toLowerCase() === "mi" || "miles" || "mile") {
        newDistance = Number(distance);
    } else if (unit.toLowerCase() === "km" || "kilometers" || "kilometer") {
        newDistance = Number(distance) * 0.621371;
    } else if (unit.toLowerCase() === "nm" || "nauticalmile" || "nauticalmiles") {
        newDistance = Number(distance) * 1.15078;
    }
    return newDistance;
};

module.exports.getRadiusMetar = async (req, res) => {
    const { icao } = req.params;
    const { distance, unit = "mile" } = req.query;
    let decode = req.query.decode === "true";
    const newDistance = distanceConverter(unit, distance);

    const metarFeatures = new MetarFeatures(AwcWeatherMetarModel, repo);
    const response = await metarFeatures.requestMetarWithinRadius_icao(icao, newDistance, decode);

    if (response) {
        res.status(200).json({
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

    res.status(200).json({
        results: response.length,
        data: response,
    });
};
