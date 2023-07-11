const axios = require("axios");
const { FAA_ATIS_API_BASE_URL } = require("../../config");

const getFaaAtis = async (location) => {
    try {
        return await axios.get(`${FAA_ATIS_API_BASE_URL}/${location}`);
    } catch (err) {
        return { data: "No ATIS found" };
    }
};

module.exports.getFaaAtis = getFaaAtis;
