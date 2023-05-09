const express = require("express");
const {
    getTempMetarForCountry,
    getVisibilityMetarForCountry,
    getBaroMetarForCountry,
    getWindMetarForCountry,
    getWindGustForCountry,
    getWeatherForCountry,
    getMetarForContinent,
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
} = require("../controllers/Weather/weatherControllers");

const router = express.Router();

// Search weather with ICAO or airport name
router.route("/search-weather/icao/:ICAO").get(getMetarUsingICAO);
router.route("/search-weather/name/:name").get(getMetarUsingAirportName);

//country
router.route("/country-weather/:country").get(getWeatherForCountry);
router.route("/country-weather/temperature/:country").get(getTempMetarForCountry);
router.route("/country-weather/visibility/:country").get(getVisibilityMetarForCountry);
router.route("/country-weather/baro/:country").get(getBaroMetarForCountry);
router.route("/country-weather/wind-speed/:country").get(getWindMetarForCountry);
router.route("/country-weather/wind-gust-speed/:country").get(getWindGustForCountry);

//continent
router.route("/continent-weather/:continent").get(getMetarForContinent);
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
