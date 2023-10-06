const express = require("express");
const {
    getTempMetarForCountry,
    getVisibilityMetarForCountry,
    getBaroMetarForCountry,
    getWindMetarForCountry,
    getWindGustForCountry,
    getWindGustForContinent,
    getWindMetarForContinent,
    getBaroMetarForContinent,
    getVisibilityMetarForContinent,
    getTempMetarForContinent,
    getWindGustForGlobal,
    getWindMetarForGlobal,
    getBaroMetarForGlobal,
    getVisibilityMetarForGlobal,
    getTempMetarForGlobal,
    getMetarUsingICAO,
    getMetarUsingAirportName,
    getMetarUsingGenericInput,
    getMetarsWithin,
    getMetarUsingIATA,
    getAirportTAF
} = require("../controllers/Weather/weatherControllers");

const router = express.Router();

// Search weather with ICAO or airport name
router.route("/search-weather/icao/:ICAO").get(getMetarUsingICAO);
router.route("/search-weather/iata/:IATA").get(getMetarUsingIATA);
router.route("/search-weather/name/:name").get(getMetarUsingAirportName);
router.route("/search-weather/generic/:data").get(getMetarUsingGenericInput);
router.route("/search-weather/weather-within/:icao").get(getMetarsWithin);

//TAF
router.route("/search-weather/taf/:icao").get(getAirportTAF);

//country
router.route("/country-weather/temperature/:country").get(getTempMetarForCountry);
router.route("/country-weather/visibility/:country").get(getVisibilityMetarForCountry);
router.route("/country-weather/baro/:country").get(getBaroMetarForCountry);
router.route("/country-weather/wind-speed/:country").get(getWindMetarForCountry);
router.route("/country-weather/wind-gust-speed/:country").get(getWindGustForCountry);

//continent
router.route("/continent-weather/wind-gust-speed/:continent").get(getWindGustForContinent);
router.route("/continent-weather/wind-speed/:continent").get(getWindMetarForContinent);
router.route("/continent-weather/baro/:continent").get(getBaroMetarForContinent);
router.route("/continent-weather/visibility/:continent").get(getVisibilityMetarForContinent);
router.route("/continent-weather/temperature/:continent").get(getTempMetarForContinent);

//global
router.route("/global-weather/wind-gust-speed").get(getWindGustForGlobal);
router.route("/global-weather/wind-speed").get(getWindMetarForGlobal);
router.route("/global-weather/baro").get(getBaroMetarForGlobal);
router.route("/global-weather/visibility").get(getVisibilityMetarForGlobal);
router.route("/global-weather/temperature").get(getTempMetarForGlobal);

module.exports = router;
