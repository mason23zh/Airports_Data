const axios = require("axios");
const { VATSIM_DATA_URL } = require("../../config");
const BadRequestError = require("../../common/errors/BadRequestError");
const logger = require("../../logger/index");

module.exports.getVatsimData = async () => {
    try {
        return await axios.get(VATSIM_DATA_URL);
    } catch (err) {
        logger.error("Vatsim data error:%O", err);
        throw new BadRequestError("VATSIM data error");
    }
};
