const fs = require("fs");
const path = require("path");
const logger = require("../../logger/index");
const StreamArray = require("stream-json/streamers/StreamArray");

const fir = path.resolve(__dirname, "../../dev-data/vatsim_data/fir_2.json");
const airport = path.resolve(
    __dirname,
    "../../dev-data/GNS430_Data/GNS430_airports_with_location.json"
);

module.exports.generateOtherControllers = async (vatsimControllers) => {
    return new Promise((resolve, reject) => {
        let controllers = [];
        const airportStream = fs
            .createReadStream(airport)
            .on("error", (err) => {
                logger.error("airport with location json not exist:%O", err);
                reject("airport with location json file not exist:%O", err);
            })
            .on("error", (err) => {
                logger.error("Error processing airport json file:%O", err);
                reject("Error processing airport json file:%O", err);
            })
            .pipe(StreamArray.withParser());

        airportStream.on("data", (data) => {
            vatsimControllers.forEach((c) => {
                let callsign = c.callsign.split("_")[0];
                if (
                    data.value?.gps_code === callsign ||
                    data.value?.iata_code === callsign ||
                    data.value?.ident === callsign ||
                    data.value?.local_code === callsign
                ) {
                    controllers.push({
                        ...c,
                        airport: {
                            name: data.value?.name,
                            icao:
                                data.value?.ident ||
                                data.value?.icao ||
                                data.value?.gps_code ||
                                data.value?.local_code
                        },
                        coordinates: [
                            data.value.coordinates.split(",")[0],
                            data.value.coordinates.split(",")[1]
                        ]
                    });
                }
            });
        });

        airportStream.on("end", () => {
            resolve(controllers);
        });
    });
};

module.exports.generateFir = async (vatsimControllers) => {
    return new Promise((resolve, reject) => {
        let formatFir = [];
        const processedControllers = new Set();
        const firStream = fs
            .createReadStream(fir)
            .on("error", (err) => {
                logger.error("fir.json not exist:%O", err);
                reject("fir.json not exist:%O", err);
            })
            .on("error", (err) => {
                logger.error("Error during stream processing: %O", err);
                reject(err);
            })
            .pipe(StreamArray.withParser());

        const firOnlyControllers = vatsimControllers.filter((controller) => {
            return controller.facility === 6;
        });

        firStream.on("data", (data) => {
            firOnlyControllers.forEach((controller) => {
                const callsign = controller.callsign.split("_")[0];
                const controllerKey = `${controller.cid}_${callsign}`;
                if (!processedControllers.has(controllerKey) && data.value[callsign]) {
                    processedControllers.add(controllerKey);
                    formatFir.push({
                        fir: data.value[callsign].icao,
                        name: controller.name,
                        cid: controller.cid,
                        facility: controller.facility,
                        rating: controller.rating,
                        callsign: controller.callsign,
                        frequency: controller.frequency,
                        visual_range: controller.visual_range,
                        last_updated: controller.last_updated,
                        logon_time: controller.logon_time
                    });
                }
            });
        });

        firStream.on("end", () => {
            resolve(formatFir);
        });
    });
};
