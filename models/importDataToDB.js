const logger = require("../logger/index");
const fs = require("fs");
const mongoose = require("mongoose");
require("dotenv").config({ path: "../config.env" });
// const { AwcWeatherMetarModel } = require("../models/weather/awcWeatherModel");
// const { Airports } = require("./airports/airportsModel");
// const { AirportFrequencies } = require("./airports/airportFrequenciesModel");
// const { Countries } = require("./airports/countriesModel");
// const { Navaids } = require("./airports/navaidsModel");
// const { Regions } = require("./airports/regionsModel");
// const { Runways } = require("./airports/runwaysModel");
const { GNS430Airport } = require("./airports/GNS430_model/gns430AirportsModel");
// const { AwcWeather } = require("./weather/weatherModel");

// const airportJsonPath = "../dev-data/json_data/Airports_2303.json";
// const airportFrequenciesJsonPath = "../dev-data/json_data/airport-frequencies.json";
// const countriesJsonPath = "../dev-data/json_data/airport-frequencies.json";
// const navidsJsonPath = "../dev-data/json_data/navaids.json";
// const regionsJsonPath = "../dev-data/json_data/regions.json";
// const runwaysJsonPath = "../dev-data/json_data/runways.json";
const gns430AirportJsonPath = "../dev-data/GNS430_Data/Airports_2303.json";
// const awcJsonPath = "../dev-data/json_data/awc_metars.json";

// mongoose.connect(`${process.env.DATABASE}`).then(() => {
//     console.log("DB connected for import data");
// });

const airports = JSON.parse(fs.readFileSync(gns430AirportJsonPath));
// const airportFreqs = JSON.parse(fs.readFileSync(airportFrequenciesJsonPath));
// const countries = JSON.parse(fs.readFileSync(countriesJsonPath));
// const navaids = JSON.parse(fs.readFileSync(navidsJsonPath));
// const regions = JSON.parse(fs.readFileSync(regionsJsonPath));
// const runways = JSON.parse(fs.readFileSync(runwaysJsonPath));
// const gns430Runway = JSON.parse(fs.readFileSync(gns430AirportJsonPath));
// const awcWeatherMetars = JSON.parse(fs.readFileSync(awcJsonPath, "utf-8"));
mongoose.connect(`${process.env.DATABASE}`).then(() => {
    logger.info("DB connected for import data");
});

class ImportData {
    constructor(model, data) {
        this.model = model;
        this.data = data;
    }

    async import() {
        try {
            await this.model.create(this.data);
            logger.info("loaded ");
        } catch (err) {
            logger.error(err);
        }
    }
}

module.exports = ImportData;

const importAwcMetar = new ImportData(GNS430Airport, airports);
importAwcMetar.import();
// const importAirport = new ImportData(Airports, airports);
// const importAirportFreq = new ImportData(AirportFrequencies, airportFreqs);
// const importCountries = new ImportData(Countries, countries);
// const importNavids = new ImportData(Navaids, navaids);
// const importRegions = new ImportData(Regions, regions);
// const importRunways = new ImportData(Runways, runways);
// const importGNS430Airports = new ImportData(GNS430Airport, gns430Runway);

// importGNS430Airports.import();
//importNavids.import();
//importRunways.import();
// const importData = async () => {
//   try {
//     await Airports.create(airports);
//     logger.info("Data succesfully loaded");
//     process.exit();
//   } catch (err) {
//     logger.error(err);
//   }
// };

//Navad: 11018 runway:43455/43675/34859
