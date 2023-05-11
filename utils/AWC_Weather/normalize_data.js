const fs = require("fs");
const awc_json_metar = "./dev-data/json_data/awc_metars.json";
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
                const tempObject = {
                    type: "Point",
                    coordinates: [Number(metar.longitude), Number(metar.latitude)],
                };
                const locationRedis = {
                    longitude: Number(metar.longitude),
                    latitude: Number(metar.latitude),
                };
                let updatedMetar = {
                    ...metar,
                    ios_country: airport.iso_country,
                    ios_region: airport.iso_region,
                    continent: airport.continent,
                    municipality: airport.municipality,
                    name: airport.name,
                    location: tempObject,
                    location_redis: locationRedis,
                };
                normalizedAwcMetar.push(updatedMetar);
            }
        }
    }
    return JSON.stringify(normalizedAwcMetar);
};
