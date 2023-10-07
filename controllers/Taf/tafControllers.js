const TafFeatures = require("./TafFeatures");
const getAirportTAF = async (req, res) => {
    const { icao } = req.params;
    let decode = req.query.decode === "true";

    const tafFeatures = new TafFeatures(icao.trim().toUpperCase());
    let responseData = {};
    try {
        const taf = await tafFeatures.requestTaf();
        if (decode === true) {
            responseData.raw = taf.getRawTaf();
            responseData.time = taf.getTafTime();
            responseData.station = taf.getTafStation();
            responseData.forecast = taf.getDecodeForecast();
        } else {
            responseData.raw = taf.getRawTaf();
        }
        console.log("TRY BLOCK");

        res.status(200).json({
            data: [responseData],
            results: 1
        });
    } catch (e) {
        console.log("CATCH BLOCK");
        res.status(200).json({ data: [], results: 0 });
    }
};

module.exports = {
    getAirportTAF
};
