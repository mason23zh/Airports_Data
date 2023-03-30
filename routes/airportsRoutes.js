const express = require("express");
const {
    getAllAirports,
    getAirportByType,
    getAirportWithRunways,
    getAirportWithNavaids,
    getNOTAM,
} = require("../controllers/airportsControllers");

const {
    getAirportByICAO_GNS430,
    getAirportByIATA_GNS430,
    getAirportByName_GNS430,
    getAirportWithin,
    getAirportsDistance,
    getAirportsByCity_GNS430,
    getAirportByGenericInput_GNS430,
} = require("../controllers/GNS430_Controllers/airportsControllers");
const commentRoutes = require("./commentRoutes");

const router = express.Router();

//nested routes
router.use("/:airporId/comments", commentRoutes);

router.route("/all-airports").get(getAllAirports);
router.route("/icao/:icao").get(getAirportByICAO_GNS430);
router.route("/iata/:iata").get(getAirportByIATA_GNS430);
router.route("/type/:type").get(getAirportByType);
router.route("/city/:name").get(getAirportsByCity_GNS430);
router.route("/generic/:data").get(getAirportByGenericInput_GNS430);
//Able to partially match e.g. winnipeg would match 3 resutls
router.route("/name/:name").get(getAirportByName_GNS430);

// Geo
// /airports-within/icao/katl/distance/200/unit/km or nm
router.route("/airports-within/icao/:icao/distance/:distance/unit/:unit").get(getAirportWithin);
// /airports-distance/origin/katl/destination/kjax/unit/km or nm
router.route("/airports-distance/origin/:originICAO/destination/:destinationICAO/unit/:unit").get(getAirportsDistance);
//For test
router.route("/runways/:icao").get(getAirportWithRunways);
router.route("/dev/airportWithNavids/:icao").get(getAirportWithNavaids);
router.route("/dev/notam").get(getNOTAM);
//router.route("/getRoute").get(getRoute);
//router.route("/dev/AirportRunway/:icao").get(testController);

module.exports = router;
