const axios = require("axios");
const { VATSIM_DATA_URL } = require("../../config");
const BadRequestError = require("../../common/errors/BadRequestError");
const NotFoundError = require("../../common/errors/NotFoundError");
const { GNS430Airport } = require("../../models/airports/GNS430_model/gns430AirportsModel");
const {
    GNS430Airport_Update
} = require("../../models/airports/GNS430_model/updateGns430AirportModel");

class VatsimData {
    constructor() {
        this.facilities = [
            {
                id: 0,
                short: "OBS",
                long: "Observer"
            },
            {
                id: 1,
                short: "FSS",
                long: "Flight Service Station"
            },
            {
                id: 2,
                short: "DEL",
                long: "Clearance Delivery"
            },
            {
                id: 3,
                short: "GND",
                long: "Ground"
            },
            {
                id: 4,
                short: "TWR",
                long: "Tower"
            },
            {
                id: 5,
                short: "APP",
                long: "Approach/Departure"
            },
            {
                id: 6,
                short: "CTR",
                long: "Enroute"
            }
        ];
    }

    static async requestVatsimData() {
        try {
            return await axios.get(VATSIM_DATA_URL);
        } catch (e) {
            throw new BadRequestError("Vatsim API ERROR");
        }
    }

    static async getAirportITAT(icao) {
        try {
            const airport = await GNS430Airport_Update.findOne({ ICAO: `${icao.toUpperCase()}` });
            return airport.iata;
        } catch (e) {
            throw new NotFoundError("Airport Not Found.");
        }
    }

    async getVatsimGeneralInfo() {
        return await VatsimData.requestVatsimData();
    }

    async getTotalNumberOfPilots() {
        const vatsimData = await VatsimData.requestVatsimData();
        if (vatsimData.data) {
            return vatsimData.data.pilots.length;
        }
        return -1;
    }

    async getTotalNumberOfControllers() {
        const vatsimData = await VatsimData.requestVatsimData();
        if (vatsimData) {
            return vatsimData.data.controllers.length;
        }
        return -1;
    }

    async getPopularAirports() {
        const sortAirports = (airportsArray) => {
            return Object.values(
                airportsArray.reduce((p, v) => {
                    const old = p[v.ICAO]; //preserve old airport object
                    if (!old)
                        p[v.ICAO] = {
                            ...v,
                            count: 1
                        };
                    //if not found, copy object and set count to 1
                    // eslint-disable-next-line no-plusplus
                    else p[v.ICAO].count++; //if found, increase counter by 1
                    return p;
                }, {})
            ).sort((a, b) => {
                return b.count - a.count; //sort counter by decrease order
            });
        };

        const vatsimData = await VatsimData.requestVatsimData();

        const vatsimPilots = vatsimData.data.pilots;
        let depAirports = [];
        let arrAirports = [];
        if (vatsimPilots) {
            for (const pilot of vatsimPilots) {
                if (
                    pilot.flight_plan?.arrival?.length > 0 &&
                    pilot.flight_plan?.departure?.length > 0
                ) {
                    depAirports.push({ ICAO: pilot.flight_plan.departure });
                    arrAirports.push({ ICAO: pilot.flight_plan.arrival });
                }
            }
        }

        const sortedArrAirports = sortAirports(arrAirports);
        const sortedDepAirports = sortAirports(depAirports);
        const combinedAirports = [];

        for (let i = 0; i < sortedArrAirports.length; i++) {
            let curArrAirport = sortedArrAirports[i];

            // out-of-bounds condition check
            if (i <= sortedDepAirports.length - 1) {
                let curDepAirport = sortedDepAirports[i];
                // parallel comparison
                if (curArrAirport.count > curDepAirport.count) {
                    // if Arrival airport has more traffic, find corresponding departure traffic number
                    let targetDepAirport = sortedDepAirports.find(
                        (o) => o.ICAO === curArrAirport.ICAO
                    );
                    // if found
                    if (targetDepAirport) {
                        // construct new airport object
                        let tempMax = {
                            ICAO: curArrAirport.ICAO,
                            arrival: curArrAirport.count,
                            departure: targetDepAirport.count
                        };
                        // add to array
                        combinedAirports.push(tempMax);
                    } else {
                        // if not found target airport, break
                        break;
                    }
                } else {
                    let targetArrAirport = sortedArrAirports.find(
                        (o) => o.ICAO === curDepAirport.ICAO
                    );
                    if (targetArrAirport) {
                        let tempMax = {
                            ICAO: curDepAirport.ICAO,
                            arrival: targetArrAirport.count,
                            departure: curDepAirport.count
                        };
                        combinedAirports.push(tempMax);
                    } else {
                        break;
                    }
                }
            }
        }

        return {
            arrival: sortedArrAirports,
            departure: sortedDepAirports,
            combined: combinedAirports
        };
    }

    async getATIS(icao) {
        const vatsimData = await VatsimData.requestVatsimData();
        const vatsimAtisList = vatsimData.data.atis;
        if (vatsimAtisList) {
            for (const atis of vatsimAtisList) {
                if (atis.callsign.includes(icao.toUpperCase())) {
                    let vatsimAtis = { data: {} };
                    vatsimAtis.data.code = atis.atis_code ? atis.atis_code : "-";
                    vatsimAtis.data.datis = atis.text_atis.join(" ");
                    return vatsimAtis;
                    // return atis.text_atis;
                }
            }
            return {
                data: `No Vatsim ATIS found in ${icao.toUpperCase()}`
            };
            // return `No Vatsim ATIS found in ${icao.toUpperCase()}`;
        }
        return { data: "Vatsim API not available" };
    }

    async onlineControllersInAirport(icao) {
        const vatsimData = await VatsimData.requestVatsimData();
        const controllerList = vatsimData.data.controllers;
        if (icao.length === 4 && icao.toUpperCase().startsWith("K")) {
            const iata = await VatsimData.getAirportITAT(icao);
            if (iata) {
                const controllerLists = controllerList.filter((controller) => {
                    if (controller.callsign.includes(iata.toUpperCase())) {
                        return controller;
                    }
                });
                return controllerLists;
            }
        } else {
            const controllerLists = controllerList.filter((controller) => {
                if (controller.callsign.includes(icao.toUpperCase())) {
                    return controller;
                }
            });
            return controllerLists;
        }
    }

    async displayControllerRange(icao) {
        const controllerList = await this.onlineControllersInAirport(icao);
        const controllerObject = { controllerList: [] };
        if (controllerList.length > 0) {
            controllerList.forEach((controller) => {
                const controllerObj = {};
                controllerObj.callsign = controller.callsign;
                controllerObj.visual_range = controller.visual_range;
                controllerObject.controllerList.push(controllerObj);
            });
        }
        const airport = await GNS430Airport.findOne({ ICAO: `${icao.toUpperCase()}` });
        controllerObject.airportLocation = airport.location;

        return controllerObject;
    }
}

module.exports = VatsimData;
