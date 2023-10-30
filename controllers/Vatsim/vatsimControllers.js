const VatsimData = require("../../utils/Vatsim_data/VatsimData");
module.exports.getVatsimEvents = async (req, res) => {
    const vatsimData = new VatsimData();
    const response = (await vatsimData.requestVatsimEventsData()).getAllVatsimEvents();
    const sortedEvents = vatsimData.sortVatsimEventsByTime("end", -1);

    for (let e of sortedEvents) {
        console.log(e.id);
        console.log(e.start_time);
        console.log(e.end_time);
        console.log("---");
    }

    res.status(200).json({
        events: response
    });
};
