const express = require("express");
const router = express.Router();
const {
    getVatsimEvents,
    sortVatsimEventsByTime,
    getCurrentVatsimEvents,
    getVatsimPilots,
    importVatsimTrafficToDb,
    updateVatsimTrafficToDb,
    getVatsimTraffics
} = require("../controllers/Vatsim/vatsimControllers");

router.get("/getEvents", getVatsimEvents);
router.get("/getSortedEventsByDate", sortVatsimEventsByTime);
router.get("/getCurrentEvents", getCurrentVatsimEvents);
router.get("/getPilots", getVatsimPilots);
router.get("/getTraffics", getVatsimTraffics);
router.get("/test", importVatsimTrafficToDb);
router.get("/testUpdate", updateVatsimTrafficToDb);
//router.get("/test", importToDB);
module.exports = router;
