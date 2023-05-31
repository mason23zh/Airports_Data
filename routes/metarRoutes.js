const express = require("express");
const { getMetar, getRadiusMetar } = require("../controllers/METAR/metarControllers");
const router = express.Router();

router.route("/get-metar/:icao").get(getMetar);
router.route("/get-metar/radius/:icao").get(getRadiusMetar);

module.exports = router;
