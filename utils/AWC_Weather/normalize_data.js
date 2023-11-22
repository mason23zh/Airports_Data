const fs = require("fs");
const awc_json_metar = "./utils/AWC_Weather/Data/awc_metars.json";
const gns430_airports_with_location = "./utils/AWC_Weather/Data/GNS430_airports_with_location.json";

module.exports.normalizeData = async () => {
    const awcMetars = JSON.parse(fs.readFileSync(awc_json_metar, "utf-8"));
    const gns430Airport = JSON.parse(fs.readFileSync(gns430_airports_with_location, "utf-8"));
    let normalizedAwcMetar = [];

    const redisValidCoordinates = (lng, lat) => {
        if (
            Number(lng) < -180 ||
            Number(lng) > 180 ||
            Number(lat) < -85.05112878 ||
            Number(lat) > 85.05112878
        ) {
            return false;
        }
        return true;
    };

    for (let airport of gns430Airport) {
        for (let metar of awcMetars) {
            if (
                metar.station_id === airport.ident &&
                redisValidCoordinates(Number(metar.longitude), Number(metar.latitude))
            ) {
                let tempVisibility = metar.visibility_statute_mi.includes("+")
                    ? Number(metar.visibility_statute_mi.replace("+", ""))
                    : Number(metar.visibility_statute_mi);
                let tempWindDir = metar.wind_dir_degrees.includes("VRB")
                    ? -1
                    : Number(metar.wind_dir_degrees);
                const tempObject = {
                    type: "Point",
                    coordinates: [Number(metar.longitude), Number(metar.latitude)]
                };
                const locationRedis = {
                    longitude: Number(metar.longitude),
                    latitude: Number(metar.latitude)
                };
                let updatedMetar = {
                    ...metar,
                    visibility_statute_mi: Number(tempVisibility),
                    wind_dir_degrees: tempWindDir,
                    ios_country: airport.iso_country,
                    ios_region: airport.iso_region,
                    continent: airport.continent,
                    municipality: airport.municipality,
                    name: airport.name,
                    location: tempObject,
                    location_redis: locationRedis
                };
                normalizedAwcMetar.push(updatedMetar);
            }
        }
    }

    return JSON.stringify(normalizedAwcMetar);
};
