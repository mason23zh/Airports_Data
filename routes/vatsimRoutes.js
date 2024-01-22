const express = require("express");
const router = express.Router();
const {
    getVatsimEvents,
    sortVatsimEventsByTime,
    getCurrentVatsimEvents,
    getVatsimPilots,
    getVatsimTraffics,
    getVatsimTrafficByCallsign_Track,
    getVatsimTraffics_Track,
    getVatsimTrafficByCID_Track,
    getVatsimTrafficByCID,
    getVatsimTrafficByCallsign,
    getVatsimFir,
    getVatsimOtherControllers,
    getVatsimControllers,
    getVatsimFSS,
    getVatsimFirFile,
    getVatsimFirBoundariesFile,
    getVatsimUirsFile
    // importVatsimToRedis,
    // findEmptyTrack
    // updatePrefileTrafficsToDb
} = require("../controllers/Vatsim/vatsimControllers");

router.get("/getEvents", getVatsimEvents);
router.get("/getSortedEventsByDate", sortVatsimEventsByTime);
router.get("/getCurrentEvents", getCurrentVatsimEvents);
router.get("/getPilots", getVatsimPilots);
router.get("/getAllTraffics/track", getVatsimTraffics_Track);
router.get("/getAllTraffics", getVatsimTraffics);
router.get("/getTrafficByCallsign/track/:callsign", getVatsimTrafficByCallsign_Track);
router.get("/getTrafficByCallsign/:callsign", getVatsimTrafficByCallsign);
router.get("/getTrafficByCID/track/:cid", getVatsimTrafficByCID_Track);
router.get("/getTrafficByCID/:cid", getVatsimTrafficByCID);

router.get("/getVatsimFir", getVatsimFir);
router.get("/getVatsimOtherControllers", getVatsimOtherControllers);
router.get("/getVatsimFSS", getVatsimFSS);
router.get("/getVatsimControllers", getVatsimControllers);

router.get("/data/vatsim-firs.json", getVatsimFirFile);
router.get("/data/vatsim-firboundaries.json", getVatsimFirBoundariesFile);
router.get("/data/vatsim-uirs.json", getVatsimUirsFile);
// router.get("/importToRedis", importVatsimToRedis);
//router.get("/checkTrack", findEmptyTrack);
// router.get("/importHistory", updatePrefileTrafficsToDb);
// router.get("/updateToRedis", updateVatsimTrafficToRedis);
module.exports = router;
