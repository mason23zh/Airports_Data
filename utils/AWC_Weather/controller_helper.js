const MetarFeatures = require("../../controllers/METAR/MetarFeatures");
const CustomError = require("../../common/errors/custom-error");
const logger = require("../../logger/index");
const getAwcMetarUsingICAO = async (icao, decode, model, repo) => {
    const metarFeatures = new MetarFeatures(model, repo);
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
        logger.error("getAwcMetarUsingICAO error:", e);
        throw new CustomError("Something went wrong, please try again later", 500);
    }
};

const getAwcMetarUsingGenericInput = async (data, decode, model, repo) => {
    const metarFeatures = new MetarFeatures(model, repo);
    try {
        return await metarFeatures.requestMetarUsingGenericInput(data, decode);
    } catch (e) {
        logger.error("getAwcMetarUsingGenericInput error:", e);
        throw new CustomError("Something went wrong, please try again later", 500);
    }
};

const getAwcMetarUsingAirportName = async (name, decode, model, repo) => {
    const metarFeatures = new MetarFeatures(model, repo);
    try {
        return await metarFeatures.requestMetarUsingAirportName(name, decode);
    } catch (e) {
        logger.error("getAwcMetarUsingAirportName error:", e);
        throw new CustomError("Something went wrong, please try again later", 500);
    }
};

module.exports = {
    getAwcMetarUsingICAO,
    getAwcMetarUsingGenericInput,
    getAwcMetarUsingAirportName
};
