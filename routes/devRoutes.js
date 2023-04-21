const express = require("express");
const {
    getDownloadFile,
    getWindMetar,
    getGlobalVisibility,
    gns430AirportsFilter,
    redisTest,
    redisReset,
} = require("../controllers/Dev/devControllers");

const router = express.Router();

router.route("/get-download").get(getDownloadFile);
router.route("/normalize-weather/:ICAO").get(getWindMetar);
router.route("/getGlobalVisibilityTest").get(getGlobalVisibility);
router.route("/filterTest").get(gns430AirportsFilter);
router.route("/redisTest").get(redisTest);
router.route("/redisRest").get(redisReset);

module.exports = router;
