const TafFeatures = require("./TafFeatures");
const CustomError = require("../../common/errors/custom-error");
const getAirportTAF = async (req, res) => {
    let decode = req.query.decode === "true";
    const icaoArray = req.params.icao.split(",");
    const uniqIcaoArray = [...new Set(icaoArray)];

    if (uniqIcaoArray.length > 3) {
        throw new CustomError("Maximum number of icao reached. Limited to 3", 429);
    }

    const tafFeatures = new TafFeatures(uniqIcaoArray);
    try {
        let responseData = [];
        const taf = await tafFeatures.requestTafNew();

        if (decode === true) {
            responseData = taf.getDecodeTaf();
        } else {
            responseData = taf.getRawTaf();
        }

        res.status(200).json({
            results: responseData.length,
            data: responseData
        });
    } catch (e) {
        res.status(200).json({ data: [], results: 0 });
    }
};

module.exports = {
    getAirportTAF
};
