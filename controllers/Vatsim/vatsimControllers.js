const VatsimData = require("../../utils/Vatsim_data/VatsimData");
module.exports.getVatsimEvents = async (req, res) => {
    const vatsimData = new VatsimData();
    const response = await vatsimData.requestVatsimEventsData();
    res.status(200).json({
        events: response
    });
};
