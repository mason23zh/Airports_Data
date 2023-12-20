const fs = require("fs");
const { Transform } = require("stream");

const gns430_airports_with_location = "./utils/AWC_Weather/Data/GNS430_airports_with_location.json";

module.exports.normalizeData = () => {
    return new Promise((resolve, reject) => {
        const gns430AirportData = fs.readFileSync(gns430_airports_with_location, "utf-8");
        const gns430Airport = JSON.parse(gns430AirportData);
        const airportMap = new Map(gns430Airport.map((airport) => [airport.ident, airport]));
        const normalizedAwcMetar = [];
        let dataBuffer = "";

        const readStream = fs.createReadStream("./utils/AWC_Weather/Data/metars.json");
        const parseStream = new Transform({
            readableObjectMode: true,
            writableObjectMode: true,
            transform(chunk, encoding, callback) {
                dataBuffer += chunk.toString();
                callback();
            },
            flush(callback) {
                // Called at the end of the stream
                try {
                    const metars = JSON.parse(dataBuffer);
                    for (let metar of metars) {
                        const airport = airportMap.get(metar.station_id);
                        if (
                            airport &&
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
                } catch (error) {
                    return callback(error);
                }
            }
        });

        readStream.pipe(parseStream);

        const resultChunks = [];
        parseStream.on("data", (chunk) => {
            resultChunks.push(chunk);
        });

        parseStream.on("finish", () => {
            resolve(resultChunks.join(""));
        });

        parseStream.on("error", (err) => {
            reject(err);
        });
    });
};

function redisValidCoordinates(lng, lat) {
    if (
        Number(lng) < -180 ||
        Number(lng) > 180 ||
        Number(lat) < -85.05112878 ||
        Number(lat) > 85.05112878
    ) {
        return false;
    }
    return true;
}
