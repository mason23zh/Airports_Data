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
    getVatsimTrafficByCallsign_Track,
    getVatsimTraffics_Track,
    getVatsimTrafficByCID_Track,
    getVatsimTrafficByCID
} = require("../controllers/Vatsim/vatsimControllers");

router.get("/getEvents", getVatsimEvents);
router.get("/getSortedEventsByDate", sortVatsimEventsByTime);
router.get("/getCurrentEvents", getCurrentVatsimEvents);
router.get("/getPilots", getVatsimPilots);
router.get("/getAllTraffics/track", getVatsimTraffics_Track);
router.get("/getAllTraffics", getVatsimTraffics);
router.get("/getTrafficByCallsign/:callsign", getVatsimTrafficByCallsign_Track);
router.get("/getTrafficByCID/track/:cid", getVatsimTrafficByCID_Track);
router.get("/getTrafficByCID/:cid", getVatsimTrafficByCID);
//router.get("/test", importToDB);
router.get("/importToRedis", importVatsimToRedis);
router.get("/updateToRedis", updateVatsimTrafficToRedis);
module.exports = router;
