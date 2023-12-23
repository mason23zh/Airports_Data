const fs = require("fs");
const gns430_airport_data = "./dev-data/GNS430_Data/airports.json";
const global_airport_data_with_location = "./dev-data/json_data/airport-codes_json.json";
const logger = require("../../logger/index");

module.exports.filterOutGlobalAirportsUsingGNS430_data = async () => {
    const globalAirportData = JSON.parse(
        fs.readFileSync(global_airport_data_with_location, "utf8")
    );
    const gns430Airport = JSON.parse(fs.readFileSync(gns430_airport_data, "utf8"));

    let filteredAirports = [];
    for (let airport of gns430Airport) {
        globalAirportData.map((g_airport) => {
            if (airport.ICAO === g_airport.ident) {
                filteredAirports.push(g_airport);
            }
        });
    }
    const filteredAirport_json = JSON.stringify(filteredAirports);
    fs.writeFileSync(
        "./dev-data/GNS430_data/GNS430_airports_with_location.json",
        filteredAirport_json
    );
    logger.info(gns430Airport.length);
    logger.info(globalAirportData.length);
};
