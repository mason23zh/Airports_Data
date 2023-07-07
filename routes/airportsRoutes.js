const express = require("express");
// const { getAllAirports, getAirportByType } = require("../controllers/airportsControllers");

const {
    getAirportByICAO_GNS430,
    getAirportByIATA_GNS430,
    getAirportsByName_GNS430,
    getAirportWithin,
    getAirportsDistance,
    getAirportsByRegion_GNS430,
    getAirportByGenericInput_GNS430,
    getAirportByICAO_GNS430_Basic,
    getAirportsByCountry,
    getAirportByGenericInput_Paginate,
    getAirportsByCountry_Paginate,
    getAirportByRegion_Paginate,
    getAirportsByName_Paginate
} = require("../controllers/GNS430_Controllers/airportsControllers");
const commentRoutes = require("./commentRoutes");

const router = express.Router();

router.use("/:airportId/comments", commentRoutes);

router.route("/icao/:icao").get(getAirportByICAO_GNS430);
router.route("/icao/basic/:icao").get(getAirportByICAO_GNS430_Basic);
router.route("/iata/:iata").get(getAirportByIATA_GNS430);
router.route("/region/:region").get(getAirportsByRegion_GNS430);
router.route("/country/:country").get(getAirportsByCountry);
router.route("/generic/:data").get(getAirportByGenericInput_GNS430);
router.route("/name/:name").get(getAirportsByName_GNS430);

// Paginate
router.route("/name/paginate/:name").get(getAirportsByName_Paginate);
router.route("/generic/paginate/:data").get(getAirportByGenericInput_Paginate);
router.route("/country/paginate/:country").get(getAirportsByCountry_Paginate);
router.route("/region/paginate/:region").get(getAirportByRegion_Paginate);

// Geo
router.route("/airports-within/icao/:icao/distance/:distance/unit/:unit").get(getAirportWithin);
router
    .route("/airports-distance/origin/:originICAO/destination/:destinationICAO/unit/:unit")
    .get(getAirportsDistance);

module.exports = router;
