const axios = require("axios");
const { VATSIM_DATA_URL } = require("../../config");
const BadRequestError = require("../../common/errors/BadRequestError");
const { Airports } = require("../../models/airports/airportsModel");
const NotFoundError = require("../../common/errors/NotFoundError");
const { GNS430Airport } = require("../../models/airports/GNS430_model/gns430AirportsModel");

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
            const airport = await Airports.findOne({ ident: `${icao.toUpperCase()}` });
            console.log(airport.iata_code);
            return airport.iata_code;
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

    async getATIS(icao) {
        const vatsimData = await VatsimData.requestVatsimData();
        const vatsimAtisList = vatsimData.data.atis;
        if (vatsimAtisList) {
            for (const atis of vatsimAtisList) {
                if (atis.callsign.includes(icao.toUpperCase())) {
                    return atis.text_atis;
                }
            }
            return `No Vatsim ATIS found in ${icao.toUpperCase()}`;
        }
        return "Vatsim API not available";
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
