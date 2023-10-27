const express = require("express");
const { getAirportTAF } = require("../controllers/Taf/tafControllers");

const router = express.Router();

router.route("/get-taf/:icao").get(getAirportTAF);

module.exports = router;
