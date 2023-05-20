const express = require("express");
const { getMetar } = require("../controllers/METAR/metarControllers");
const router = express.Router();

router.route("/get-metar/:icao").get(getMetar);

module.exports = router;
