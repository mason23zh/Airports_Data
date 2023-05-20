// noinspection JSUnresolvedVariable,JSCheckFunctionSignatures

require("dotenv").config({ path: "../../config.env" });
const { AwcWeatherMetarModel } = require("../../models/weather/awcWeatherModel");
const { awcMetarSchema } = require("../../redis/awcMetar");
const RedisClient = require("../../redis/RedisClient");
const MetarFeatures = require("./MetarFeatures");
const rClient = new RedisClient();

let repo;
let metarFeatures;
(async () => {
    await rClient.openNewRedisOMClient(process.env.REDIS_URL);
    repo = rClient.createRedisOMRepository(awcMetarSchema);
    metarFeatures = new MetarFeatures(repo, AwcWeatherMetarModel);
})();

module.exports.getMetar = async (req, res) => {
    const { decode } = req.query;
    const icaoArray = req.params.icao.split(",");
    const uniqIcaoArray = [...new Set(icaoArray)];
    let tempMetars = [];

    await Promise.all(
        uniqIcaoArray.map(async (icao) => {
            try {
                const responseMetar = await metarFeatures.getMetarUsingICAO(icao.toUpperCase(), decode);
                tempMetars.push(responseMetar);
            } catch (e) {
                let tempResponse = {
                    status: "error",
                    message: `${icao} can not be found.`,
                };
                tempMetars.push(tempResponse);
            }
        })
    );

    res.status(200).json({
        status: "success",
        data: tempMetars,
    });
};
