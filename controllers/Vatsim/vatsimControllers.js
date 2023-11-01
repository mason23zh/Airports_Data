const VatsimData = require("../../utils/Vatsim_data/VatsimData");
module.exports.getVatsimEvents = async (req, res) => {
    const vatsimData = new VatsimData();
    const response = (await vatsimData.requestVatsimEventsData()).getAllVatsimEvents();

    res.status(200).json({
        results: response.length,
        events: response
    });
};

module.exports.sortVatsimEventsByTime = async (req, res) => {
    let { target = "start" } = req.query;
    let { sort } = req.query;
    if (target !== "start" || target !== "end") {
        target = "start";
    }
    if (!req.query.sort || (req.query.sort !== "-1" && req.query.sort !== "1")) {
        sort = "1";
    }

    const vatsimData = (await new VatsimData()).requestVatsimEventsData();
    const sortedEvents = (await vatsimData).sortVatsimEventsByTime(target, Number(sort));

    res.status(200).json({
        results: sortedEvents.length,
        events: sortedEvents
    });
};

module.exports.getCurrentVatsimEvents = async (req, res) => {
    const vatsimData = (await new VatsimData()).requestVatsimEventsData();
    const currentEvents = (await vatsimData).getCurrentVatsimEvents();
    res.status(200).json({
        results: currentEvents.length,
        events: currentEvents
    });
};
