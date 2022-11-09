const axios = require("axios");
const { CHECK_WEATHER_BASE_URL } = require("../../config");

const getMetar = async (station, location) => {
    try {
        const config = {
            headers: {
                "X-API-KEY": process.env.X_API_KEY,
            },
        };
        const apiURL = `${CHECK_WEATHER_BASE_URL}/${station}/${location}/decoded`;
        const responseMetar = await axios.get(apiURL, config);

        return responseMetar.data;
    } catch (err) {
        return { data: [] };
    }
};

module.exports.getMetar = getMetar;
