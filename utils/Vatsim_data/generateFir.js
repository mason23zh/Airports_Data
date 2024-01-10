const fs = require("fs");
const path = require("path");
const logger = require("../../logger/index");
const StreamArray = require("stream-json/streamers/StreamArray");
const StreamValues = require("stream-json/streamers/StreamValues");

const fir = path.resolve(__dirname, "./fir_2.json");
const airport = path.resolve(__dirname, "./GNS430_airports_with_location.json");
const uris = path.resolve(__dirname, "./uris.json");

module.exports.generateFSS = async (vatsimControllers) => {
    logger.info("Generating fss");
    return new Promise((resolve, reject) => {
        let fss = [];
        const fssStream = fs
            .createReadStream(uris)
            .on("error", (err) => {
                logger.error("uris.json not exist: %O", err);
                reject("uris.json not exist: %O", err);
            })
            .on("error", (err) => {
                logger.error("Error processing uris.json: %O", err);
                reject("Error processing uris.json: %O", err);
            })
            .pipe(StreamValues.withParser());

        fssStream.on("data", (data) => {
            vatsimControllers.forEach((c) => {
                if (c.facility === 1) {
                    let { callsign } = c;
                    fss.push({
                        ...c,
                        firInfo: {
                            ...data.value[callsign]
                        }
                    });
                }
            });
        });

        fssStream.on("end", () => {
            resolve(fss);
        });
    });
};
module.exports.generateControllersAndAtis = async (vatsimControllers, vatsimAtis) => {
    return new Promise((resolve, reject) => {
        let controllers = [];
        let atis = [];
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
            vatsimAtis.forEach((a) => {
                let atisCallsign = a.callsign.split("_")[0];
                if (
                    data.value?.gps_code === atisCallsign ||
                    data.value?.iata_code === atisCallsign ||
                    data.value?.ident === atisCallsign ||
                    data.value?.local_code === atisCallsign
                ) {
                    atis.push({
                        ...a,
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
            vatsimControllers.forEach((c) => {
                let callsign = c.callsign.split("_")[0];
                if (
                    (data.value?.gps_code === callsign ||
                        data.value?.iata_code === callsign ||
                        data.value?.ident === callsign ||
                        data.value?.local_code === callsign) &&
                    c.facility !== 6 &&
                    c.facility !== 1 &&
                    c.facility !== 0
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
            resolve({ controllers: controllers, atis: atis });
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
