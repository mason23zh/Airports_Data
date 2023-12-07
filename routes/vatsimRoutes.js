const express = require("express");
const router = express.Router();
const {
    getVatsimEvents,
    sortVatsimEventsByTime,
    getCurrentVatsimEvents,
    getVatsimPilots,
    getVatsimTraffics,
    importVatsimToRedis,
    updateVatsimTrafficToRedis,
    getVatsimTrafficByCallsign
} = require("../controllers/Vatsim/vatsimControllers");

router.get("/getEvents", getVatsimEvents);
router.get("/getSortedEventsByDate", sortVatsimEventsByTime);
router.get("/getCurrentEvents", getCurrentVatsimEvents);
router.get("/getPilots", getVatsimPilots);
router.get("/getTraffics", getVatsimTraffics);
router.get("/getTrafficByCallsign/:callsign", getVatsimTrafficByCallsign);
//router.get("/test", importToDB);
router.get("/importToRedis", importVatsimToRedis);
router.get("/updateToRedis", updateVatsimTrafficToRedis);
module.exports = router;
