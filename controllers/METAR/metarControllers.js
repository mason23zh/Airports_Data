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
            await metarFeature.requestMetarUsingICAO(icao);
            // console.log(metarFeature.getNormalMetar());
            // metarFeature.generateWeather().generateBarometer().generateCloud();
            // console.log(metarFeature.getClouds());
            // console.log(metarFeature.getWeatherCondition());
            // console.log(metarFeature.getBarometer());
            if (decode === "true") {
                responseMetarArray.push(metarFeature.getNormalMetar());
            }
            if (decode === "false") {
                responseMetarArray.push(metarFeature.getRawMetar());
            }
        })
    );

    res.status(200).json({
        status: "success",
        data: responseMetarArray,
    });
};
