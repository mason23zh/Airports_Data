const axios = require("axios");
const { FAA_ATIS_API_BASE_URL } = require("../../config");
const { getRandomUserAgent } = require("../Online_Flight_Data/randomUserAgent");

const getFaaAtis = async (location) => {
    try {
        // const response = await axios.get(`${FAA_ATIS_API_BASE_URL}/${location}`);
        const response = await axios.get(`${FAA_ATIS_API_BASE_URL}/${location}`, {
            timeout: 10000,
            headers: {
                "User-Agent": getRandomUserAgent()
            }
        });
        if (response.data && response.data.length > 0) {
            return { data: response.data };
        } else {
            return { data: [] };
        }
    } catch (err) {
        return { data: [] };
    }
};

module.exports.getFaaAtis = getFaaAtis;
