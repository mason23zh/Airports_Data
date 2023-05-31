const express = require("express");
const { getMetar, getRadiusMetar, getRadiusMetarWithLngLat } = require("../controllers/METAR/metarControllers");
const router = express.Router();

router.route("/get-metar/:icao").get(getMetar);
router.route("/get-metar/radius/:icao").get(getRadiusMetar);
router.route("/get-metar/radius/coordinates/:coordinates").get(getRadiusMetarWithLngLat);

module.exports = router;
