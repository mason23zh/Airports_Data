const { getFaaAtis } = require("./getFaaAtis");

module.exports.generateFAAResponseATIS = async (icao) => {
    const responseATIS = await getFaaAtis(icao.toUpperCase());

    if (responseATIS.data.error) {
        responseATIS.data = `No FAA ATIS found in ${icao.toUpperCase()}`;
    }
    return responseATIS;
};
