const express = require("express");
const {
    getMetar,
    getRadiusMetar,
    getRadiusMetarWithLngLat,
    getNearestMetar_icao,
} = require("../controllers/METAR/metarControllers");
const router = express.Router();

router.route("/get-metar/:icao").get(getMetar);
router.route("/get-metar/radius/:icao").get(getRadiusMetar);
router.route("/get-metar/radius/coordinates/:coordinates").get(getRadiusMetarWithLngLat);
router.route("/get-metar/nearest/:icao").get(getNearestMetar_icao);

module.exports = router;
