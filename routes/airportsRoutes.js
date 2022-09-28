// noinspection SpellCheckingInspection

const express = require("express");
const {
    getAllAirports,
    getAirportByICAO,
    getAirportByIATA,
    getAirportByType,
    getAirportByName,
    getAirportWithRunways,
    getAirportWithNavaids,
    getNOTAM,
} = require("../controllers/airportsControllers");

const { protect } = require("../controllers/authControllers");

const router = express.Router();

router.route("/all-airports").get(getAllAirports);
router.route("/icao/:icao").get(getAirportByICAO);
router.route("/iata/:iata").get(getAirportByIATA);
router.route("/type/:type").get(getAirportByType);
//Able to partially match e.g. winnipeg would match 3 resutls
router.route("/name/:name").get(protect, getAirportByName);

//For test
router.route("/runways/:icao").get(getAirportWithRunways);
router.route("/dev/airportWithNavids/:icao").get(getAirportWithNavaids);
router.route("/dev/notam").get(getNOTAM);
//router.route("/dev/AirportRunway/:icao").get(testController);

module.exports = router;
