const fs = require("fs");
const path = require("path");
const logger = require("../../logger/index");
const StreamArray = require("stream-json/streamers/StreamArray");
const StreamValues = require("stream-json/streamers/StreamValues");
const paths = require("../../utils/path/paths");

const fir = path.resolve(__dirname, "./fir_2.json");
const airport = paths.gns430AirportsWithLocation;
const uris = path.resolve(__dirname, "./uris.json");
const simplifiedFIRGeoJsonFeature = path.resolve(__dirname, "./simplifiedGeoJsonFeature.json");
// const vatsimControllersData_Test = path.resolve(__dirname, "./vatsim-data-sbwr-tracon.json");
// const vatsimControllersData_Test = path.resolve(
//     __dirname,
//     "./vatsim-data-ctp-controllers-only.json"
// );
module.exports.generateFSS = async (vatsimControllers) => {
    // logger.info("Generating fss");
    return new Promise((resolve, reject) => {
        let fss = [];
        // LOCAL FILE TEST
        // let vatsimControllers;
        // if (useTestData) {
        //     try {
        //         const data = fs.readFileSync(vatsimControllersData_Test);
        //         vatsimControllers = JSON.parse(data);
        //     } catch (err) {
        //         logger.error("Failed to read or parse test data: %O", err);
        //         return reject("Failed to load test data");
        //     }
        // }
        // LOCAL FILE TEST
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
                    c.facility !== 5 &&
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

module.exports.generateTracon = async (vatsimControllers) => {
    // LOCAL FILE TEST
    // let vatsimControllers;
    // if (useTestData) {
    //     try {
    //         const data = fs.readFileSync(vatsimControllersData_Test);
    //         vatsimControllers = JSON.parse(data);
    //     } catch (err) {
    //         logger.error("Failed to read or parse test data: %O", err);
    //         return [];
    //     }
    // }
    // LOCAL FILE TEST
    return new Promise((resolve, reject) => {
        let controllers = [];
        const controllerSet = new Set();
        const airportStream = fs
            .createReadStream(airport)
            .on("error", (err) => {
                logger.error("Error with airport JSON file: %O", err);
                reject("Error with airport JSON file");
            })
            .pipe(StreamArray.withParser());

        // Iterate through each airport and match it with controllers
        airportStream.on("data", (data) => {
            vatsimControllers.forEach((c) => {
                if (c.facility === 5 && !controllerSet.has(c.callsign)) {
                    let callsign = c.callsign.split("_")[0];

                    if (
                        data.value.gps_code === callsign ||
                        data.value.iata_code === callsign ||
                        data.value.ident === callsign ||
                        data.value.local_code === callsign
                    ) {
                        controllerSet.add(c.callsign);
                        controllers.push({
                            ...c,
                            airport: {
                                name: data.value.name,
                                icao:
                                    data.value.ident ||
                                    data.value.icao ||
                                    data.value.gps_code ||
                                    data.value.local_code
                            },
                            coordinates: [
                                data.value.coordinates.split(",")[0],
                                data.value.coordinates.split(",")[1]
                            ]
                        });
                    }
                }
            });
        });

        airportStream.on("end", () => {
            // Handle controllers that were not matched with any airport
            // If not match found, return the controller with empty airport object and coordinates
            vatsimControllers.forEach((c) => {
                if (c.facility === 5 && !controllerSet.has(c.callsign)) {
                    controllerSet.add(c.callsign);
                    controllers.push({
                        ...c,
                        airport: {},
                        coordinates: []
                    });
                }
            });
            resolve(controllers);
        });
    });
};

module.exports.generateFir = async (vatsimControllers) => {
    return new Promise((resolve, reject) => {
        let formatFir = [];
        //LOCAL TEST FILE
        // let vatsimControllers;
        // if (useTestData) {
        //     try {
        //         const data = fs.readFileSync(vatsimControllersData_Test);
        //         vatsimControllers = JSON.parse(data);
        //     } catch (err) {
        //         logger.error("Failed to read or parse test data: %O", err);
        //         return reject("Failed to load test data");
        //     }
        // }

        //LOCAL TEST FILE
        const firOnlyControllers = vatsimControllers.filter(
            (controller) => controller.facility === 6
        );
        const processedControllers = new Set();
        const specialControllers = [];
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

        firStream.on("data", ({ value }) => {
            firOnlyControllers.forEach((controller) => {
                const callsign = controller.callsign.split("_")[0];
                const controllerKey = `${controller.cid}_${callsign}`;

                if (callsign === "ANT") {
                    specialControllers.push(controller);
                } else if (!processedControllers.has(controllerKey) && value[callsign]) {
                    processedControllers.add(controllerKey);
                    formatFir.push({
                        firInfo: value[callsign],
                        fir: value[callsign].icao,
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
            // Handle the special case for "ANT"
            specialControllers.forEach((controller) => {
                ["MDCS", "TNCF", "MTEG"].forEach((icao) => {
                    const specialKey = `${controller.cid}_${icao}`;
                    if (!processedControllers.has(specialKey)) {
                        processedControllers.add(specialKey);
                        if (icao === "MDCS") {
                            formatFir.push({
                                firInfo: {
                                    icao: "MDCS",
                                    name: "Santo Domingo",
                                    prefix: "",
                                    fir: "MDCS"
                                },
                                fir: icao,
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

                        if (icao === "TNCF") {
                            formatFir.push({
                                firInfo: {
                                    icao: "TNCF",
                                    name: "Cura\u00e7ao",
                                    prefix: "",
                                    fir: "TNCF"
                                },
                                fir: icao,
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

                        if (icao === "MTEG") {
                            formatFir.push({
                                firInfo: {
                                    icao: "MTEG",
                                    name: "Port-Au-Prince",
                                    prefix: "",
                                    fir: "MTEG"
                                },
                                fir: icao,
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
                    }
                });
            });
            resolve(formatFir);
        });
    });
};
