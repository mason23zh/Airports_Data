const fs = require("fs");
const { parser } = require("stream-json");
const { streamArray } = require("stream-json/streamers/StreamArray");
const util = require("util");
const readFile = util.promisify(fs.readFile);

const gns430_airports_with_location = "./utils/AWC_Weather/Data/GNS430_airports_with_location.json";

module.exports.normalizeData = async () => {
    const gns430AirportData = await readFile(gns430_airports_with_location, "utf-8");
    const gns430Airport = JSON.parse(gns430AirportData);
    const airportMap = new Map(gns430Airport.map((airport) => [airport.ident, airport]));

    return processMetars(airportMap);
};

const processMetars = async (airports) => {
    return new Promise((resolve, reject) => {
        const metarsStream = fs
            .createReadStream("./utils/AWC_Weather/Data/metars.json")
            .on("error", (err) => {
                console.error("metars.json not exist: ", err);
                reject("metars.json not exist:", err);
            })
            .pipe(parser())
            .pipe(streamArray());
        const normalizedMetars = [];

        metarsStream.on("data", ({ value: metar }) => {
            const airport = airports.get(metar.station_id);
            if (airport && redisValidCoordinates(Number(metar.longitude), Number(metar.latitude))) {
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
                    temp_c: Number(metar.temp_c),
                    dewpoint_c: Number(metar.dewpoint_c),
                    wind_speed_kt: Number(metar.wind_speed_kt),
                    wind_gust_kt: Number(metar.wind_gust_kt),
                    altim_in_hg: Number(metar.altim_in_hg),
                    elevation_m: Number(metar.elevation_m),
                    auto: metar.auto || "FALSE",
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
                normalizedMetars.push(updatedMetar);
            }
        });

        metarsStream.on("end", () => {
            resolve(normalizedMetars);
        });

        metarsStream.on("error", (e) => {
            reject("error normalize/process metar:", e);
        });
    });
};

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
