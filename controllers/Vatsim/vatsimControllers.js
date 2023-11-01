const VatsimData = require("../../utils/Vatsim_data/VatsimData");
module.exports.getVatsimEvents = async (req, res) => {
    const vatsimData = new VatsimData();
    const response = (await vatsimData.requestVatsimEventsData()).getAllVatsimEvents();

    res.status(200).json({
        events: response
    });
};

module.exports.sortVatsimEventsByTime = async (req, res) => {
    let { target = "start" } = req.query;
    let sort;
    if (target !== "start" || target !== "end") {
        target = "start";
    }
    if (!req.query.sort || (req.query.sort !== "-1" && req.query.sort !== "1")) {
        sort = "1";
    } else {
        sort = req.query.sort;
    }

    const vatsimData = (await new VatsimData()).requestVatsimEventsData();
    const sortedEvents = (await vatsimData).sortVatsimEventsByTime(target, Number(sort));

    res.status(200).json({
        events: sortedEvents
    });
};
