const express = require("express");
// const { getAllAirports, getAirportByType } = require("../controllers/airportsControllers");

const {
    getAirportByICAO_GNS430,
    getAirportByIATA_GNS430,
    getAirportByName_GNS430,
    getAirportWithin,
    getAirportsDistance,
    getAirportsByCity_GNS430,
    getAirportByGenericInput_GNS430,
    getAirportByICAO_GNS430_Basic,
    isoTest,
    getAirportsByCountry
} = require("../controllers/GNS430_Controllers/airportsControllers");
const commentRoutes = require("./commentRoutes");

const router = express.Router();

router.use("/:airportId/comments", commentRoutes);

router.route("/iso/:data").get(isoTest);
router.route("/icao/:icao").get(getAirportByICAO_GNS430);
router.route("/icao/basic/:icao").get(getAirportByICAO_GNS430_Basic);
router.route("/iata/:iata").get(getAirportByIATA_GNS430);
router.route("/city/:name").get(getAirportsByCity_GNS430);
router.route("/country/:country").get(getAirportsByCountry);
router.route("/generic/:data").get(getAirportByGenericInput_GNS430);
router.route("/name/:name").get(getAirportByName_GNS430);

// Geo
router.route("/airports-within/icao/:icao/distance/:distance/unit/:unit").get(getAirportWithin);
router
    .route("/airports-distance/origin/:originICAO/destination/:destinationICAO/unit/:unit")
    .get(getAirportsDistance);

module.exports = router;
