const fs = require("fs");
const awc_json_metar = "./dev-data/json_data/awc_metars.json";
const global_airport_icao = "./dev-data/json_data/airport-codes_json.json";
// const gns430_airport_data = "./dev-data/GNS430_Data/airports.json";
const gns430_airports_with_location = "./dev-data/GNS430_Data/GNS430_airports_with_location.json";

module.exports.normalizeData = async () => {
    const awcMetars = JSON.parse(fs.readFileSync(awc_json_metar, "utf-8"));
    // const globalAirportIcao = JSON.parse(fs.readFileSync(global_airport_icao), "utf-8");
    const gns430Airport = JSON.parse(fs.readFileSync(gns430_airports_with_location, "utf-8"));
    // console.log(awcMetars[0]);
    let normalizedAwcMetar = [];

    for (let airport of gns430Airport) {
        for (let metar of awcMetars) {
            if (metar.station_id === airport.ident) {
                let updatedMetar = {
                    ...metar,
                    ios_country: airport.iso_country,
                    ios_region: airport.iso_region,
                    continent: airport.continent,
                };
                normalizedAwcMetar.push(updatedMetar);
            }
        }
    }
    // console.log(normalizedAwcMetar.length);
    return JSON.stringify(normalizedAwcMetar);
};
