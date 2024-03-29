const VatsimData = require("../../utils/Vatsim_data/VatsimData");
module.exports.getVatsimEvents = async (req, res) => {
    const vatsimData = new VatsimData();
    const response = await vatsimData.getAllVatsimEvents();

    res.status(200).json({
        results: response.length,
        events: response
    });
};

module.exports.sortVatsimEventsByTime = async (req, res) => {
    let { target } = req.query;
    let { sort } = req.query;
    if (!target || target.length === 0) {
        target = "start_time";
    } else if (target !== "start" || target !== "end") {
        target = "start_time";
    } else if (target.includes("start")) {
        target = "start_time";
    } else if (target.includes("end")) {
        console.log("trigger");
        target = "end_time";
    }
    if (!req.query.sort || (req.query.sort !== "-1" && req.query.sort !== "1")) {
        sort = 1;
    } else if (req.query.sort === "1") {
        sort = 1;
    } else if (req.query.sort === "-1") {
        sort = -1;
    }

    const vatsimData = new VatsimData();
    const sortedEvents = await vatsimData.sortVatsimEventsByTime(target, sort);

    res.status(200).json({
        results: sortedEvents.length,
        events: sortedEvents
    });
};

module.exports.getCurrentVatsimEvents = async (req, res) => {
    const vatsimData = new VatsimData();
    const currentEvents = await vatsimData.getCurrentVatsimEvents();
    res.status(200).json({
        results: currentEvents.length,
        events: currentEvents
    });
};

module.exports.importToDB = async (req, res) => {
    const vatsimData = (await new VatsimData()).requestVatsimEventsData();
    const result = await (await vatsimData).storeVatsimEventsToDB();
    res.status(200).json({
        data: result
    });
};

module.exports.getVatsimPilots = async (req, res) => {
    let vatsimPilots;
    const vatsim = new VatsimData();
    const vatsimData = await vatsim.requestVatsimData();
    if (vatsimData) {
        vatsimPilots = vatsim.getVatsimPilots();
    }
    res.status(200).json({
        data: {
            results: vatsimPilots.length,
            pilots: vatsimPilots
        }
    });
};
