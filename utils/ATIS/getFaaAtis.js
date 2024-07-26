const axios = require("axios");
const { FAA_ATIS_API_BASE_URL } = require("../../config");

const getFaaAtis = async (location) => {
    try {
        const response = await axios.get(`${FAA_ATIS_API_BASE_URL}/${location}`);
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
