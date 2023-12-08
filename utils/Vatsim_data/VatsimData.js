require("dotenv").config({ path: "../../config.env" });
const redis = require("redis");
const axios = require("axios");
const { VATSIM_DATA_URL, VATSIM_EVENTS_URL } = require("../../config");
const { VatsimEvents } = require("../../models/vatsim/vatsimEventsModel");
const BadRequestError = require("../../common/errors/BadRequestError");
const NotFoundError = require("../../common/errors/NotFoundError");
const { GNS430Airport } = require("../../models/airports/GNS430_model/gns430AirportsModel");
const { VatsimTraffics } = require("../../models/vatsim/vatsimTrafficsModel");
const {
    GNS430Airport_Update
} = require("../../models/airports/GNS430_model/updateGns430AirportModel");
const _ = require("lodash");
const { VatsimHistoryTraffics } = require("../../models/vatsim/vatsimHistoryTrafficsModel");
const { VatsimTraffics_Prods } = require("../../models/vatsim/vatsimTrafficModel_Prod");
const RedisClient = require("../../redis/RedisClient");
const { vatsimTrafficsSchema, exampleSchema } = require("../../redis/vatsimTraffics");
const { Client, Repository, EntityId } = require("redis-om");

class VatsimData {
    constructor() {
        this.normalizedVatsimTraffics = [];
        this.vatsimPilots = [];
        this.vatsimControllers = [];
        this.vatsimAtis = [];
        this.vatsimEvents = [];
        this.L1 = 0;
        this.L2 = 0;
        this.L3 = 0;
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

    static async getAirportITAT(icao) {
        try {
            const airport = await GNS430Airport_Update.findOne({ ICAO: `${icao.toUpperCase()}` });
            return airport.iata;
        } catch (e) {
            throw new NotFoundError("Airport Not Found.");
        }
    }

    async storeVatsimEventsToDB() {
        if (this.vatsimEvents.length <= 0) {
            return null;
        }
        try {
            console.log("starting import vatsim events to db...");
            // delete all previous events
            await VatsimEvents.deleteMany({});
            const doc = await VatsimEvents.create(JSON.parse(JSON.stringify(this.vatsimEvents)));
            if (doc.length > 0) {
                console.log("successfully import vatsim events to db ");
            }
            return doc.length;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async requestVatsimEventsData() {
        try {
            const response = await axios.get(VATSIM_EVENTS_URL);
            if (response) {
                if (response.data.data.length > 0) {
                    this.vatsimEvents = response.data.data;
                }
            }
        } catch (e) {
            throw new BadRequestError("Vatsim API ERROR");
        }
        return this;
    }

    async getAllVatsimEvents() {
        try {
            const currentTime = new Date(new Date()).toISOString();
            // filter out the events that already ended
            const docs = await VatsimEvents.find({ end_time: { $gte: currentTime } });
            if (docs && docs.length > 0) {
                return docs;
            } else {
                return this.vatsimEvents;
            }
        } catch (e) {
            return [];
        }
    }

    async sortVatsimEventsByTime(timeFlag, order) {
        try {
            let docs;
            const currentTime = new Date(new Date()).toISOString();

            if (timeFlag === "start_time") {
                docs = await VatsimEvents.find({ end_time: { $gte: currentTime } }).sort({
                    start_time: order
                });
            } else if (timeFlag === "end_time") {
                docs = await VatsimEvents.find({ end_time: { $gte: currentTime } }).sort({
                    end_time: order
                });
            }
            if (docs && docs.length > 0) {
                return docs;
            }
        } catch (e) {
            return [];
        }
    }

    async getCurrentVatsimEvents() {
        try {
            const currentTime = new Date().getTime();
            const docs = await VatsimEvents.find({
                end_time: { $gte: new Date(new Date()).toISOString() }
            }).sort({ start_time: 1 });
            if (docs && docs.length > 0) {
                return docs.filter((t) => {
                    if (t.start_time && t.end_time) {
                        let startTimeStamp = new Date(t.start_time).getTime();
                        let endTimeStamp = new Date(t.end_time).getTime();
                        if (startTimeStamp <= currentTime && endTimeStamp >= currentTime) {
                            return t;
                        }
                    }
                });
            } else {
                return [];
            }
        } catch (e) {
            return [];
        }
    }

    async requestVatsimData() {
        try {
            const response = await axios.get(VATSIM_DATA_URL);
            if (response) {
                if (response.data.pilots.length > 0) {
                    this.vatsimPilots = response.data.pilots;
                }
                if (response.data.controllers.length > 0) {
                    this.vatsimControllers = response.data.controllers;
                }
                if (response.data.atis.length > 0) {
                    this.vatsimAtis = response.data.atis;
                }
                return response;
            }
        } catch (e) {
            throw new BadRequestError("Vatsim API ERROR");
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

    async getPopularAirports(limit) {
        if (!limit) limit = 10;
        const { vatsimPilots } = this;
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
                    else p[v.ICAO].count += 1; //if found, increase counter by 1
                    return p;
                }, {})
            ).sort((a, b) => {
                return b.count - a.count; //sort counter by decrease order
            });
        };

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

        let sortedArrAirports = sortAirports(arrAirports).slice(0, limit);
        let sortedDepAirports = sortAirports(depAirports).slice(0, limit);
        const combinedAirports = [];
        const airportSortingOrder = [];

        while (sortedDepAirports.length > 0 && sortedArrAirports.length > 0) {
            // compare first element of both array since they are sorted
            if (sortedArrAirports[0].count > sortedDepAirports[0].count) {
                let arrICAO = sortedArrAirports[0].ICAO;
                let arrCount = sortedArrAirports[0].count;
                let depAirport = sortedDepAirports.find((e) => e.ICAO === arrICAO);
                if (depAirport) {
                    let tempAirportObj = {
                        ICAO: arrICAO,
                        arrival: arrCount,
                        departure: depAirport.count
                    };
                    combinedAirports.push(tempAirportObj);
                    airportSortingOrder.push(arrICAO);
                }
                // remove element with same ICAO in depAirport list
                sortedDepAirports = sortedDepAirports.filter((e) => e.ICAO !== arrICAO);
                // remove first element in arrAirport list
                sortedArrAirports.shift();
            } else {
                //dep count > arr count
                let depICAO = sortedDepAirports[0].ICAO;
                let depCount = sortedArrAirports[0].count;
                let arrAirport = sortedDepAirports.find((e) => e.ICAO === depICAO);

                if (arrAirport) {
                    let tempAirportObj = {
                        ICAO: depICAO,
                        arrival: arrAirport.count,
                        departure: depCount
                    };
                    airportSortingOrder.push(depICAO);
                    combinedAirports.push(tempAirportObj);
                }
                // remove element with same ICAO in arrAirport list
                sortedArrAirports = sortedArrAirports.filter((e) => e.ICAO !== depICAO);
                // remove first element in depAirport list
                sortedDepAirports.shift();
            }
        }

        // attach controller information and ATIS information
        let tempCombined = [];
        for await (let airport of combinedAirports) {
            const controllerStatus = await this.onlineControllerStatus(airport.ICAO);
            const controllerATIS = this.checkATIS(airport.ICAO);
            let tempObj = {
                ...airport,
                ...controllerStatus,
                ATIS: controllerATIS
            };
            tempCombined.push(tempObj);
        }

        return {
            arrival: sortedArrAirports,
            departure: sortedDepAirports,
            combined: tempCombined,
            sortingOrder: airportSortingOrder
        };
    }

    checkATIS(icao) {
        const vatsimAtisList = this.vatsimAtis;
        if (vatsimAtisList.length !== 0) {
            for (const atis of vatsimAtisList) {
                if (atis.callsign.includes(icao.toUpperCase())) {
                    return true;
                }
            }
        } else {
            return false;
        }
    }

    getATIS(icao) {
        const vatsimAtisList = this.vatsimAtis;
        if (vatsimAtisList) {
            for (const atis of vatsimAtisList) {
                if (atis.callsign.includes(icao.toUpperCase())) {
                    let vatsimAtis = { data: {} };
                    vatsimAtis.data.code = atis.atis_code ? atis.atis_code : "-";
                    vatsimAtis.data.datis = atis.text_atis.join(" ");
                    return vatsimAtis;
                }
            }
            return {
                data: `No Vatsim ATIS found in ${icao.toUpperCase()}`
            };
        }
        return { data: "Vatsim API not available" };
    }

    async onlineControllersInAirport(icao) {
        const controllerList = this.vatsimControllers;
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

    async onlineControllerStatus(icao) {
        const controllers = await this.onlineControllersInAirport(icao);

        let tempObj = {
            DEL: false,
            GND: false,
            TWR: false,
            APP: false
        };
        for (let controller of controllers) {
            if (controller) {
                if (controller.callsign.includes("DEL")) {
                    tempObj.DEL = true;
                }
                if (controller.callsign.includes("GND")) {
                    tempObj.GND = true;
                }
                if (controller.callsign.includes("TWR")) {
                    tempObj.TWR = true;
                }
                if (controller.callsign.includes("APP")) {
                    tempObj.APP = true;
                }
            }
        }
        return tempObj;
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

    #validateVatsimTraffic(flight) {
        if (
            !flight.cid ||
            !flight.callsign ||
            !flight.latitude ||
            !flight.longitude ||
            (!flight.altitude && flight.altitude !== 0) ||
            (!flight.heading && flight.heading !== 0)
        ) {
            console.log("invalid flights:", flight);
            return false;
        }
        return true;
    }

    #buildTrafficObject(traffic, trackFlag) {
        let tempObject = {
            track: [],
            aircraft: {}
        };
        let tempObjectTrack = {};
        tempObject.cid = traffic.cid;
        tempObject.name = traffic.name;
        tempObject.callsign = traffic.callsign;
        tempObject.server = traffic.server;
        tempObject.transponder = traffic.transponder;
        tempObject.flightRules = !traffic.flight_plan?.flight_rules || "N/A";
        tempObject.aircraft.full = traffic.flight_plan?.aircraft || "N/A";
        tempObject.aircraft.faa = traffic.flight_plan?.aircraft_faa || "N/A";
        tempObject.aircraft.short = traffic.flight_plan?.aircraft_short || "N/A";
        tempObject.arrival = traffic.flight_plan?.arrival || "N/A";
        tempObject.departure = traffic.flight_plan?.departure || "N/A";
        tempObject.alternate = traffic.flight_plan?.alternate || "N/A";
        tempObject.depTime = traffic.flight_plan?.deptime || "N/A";
        tempObject.enrouteTime = traffic.flight_plan?.enroute_time || "N/A";
        tempObject.fuelTime = traffic.flight_plan?.fuel_time || "N/A";
        tempObject.remarks = traffic.flight_plan?.remarks || "N/A";
        tempObject.route = traffic.flight_plan?.route || "N/A";
        tempObject.logonTime = traffic.logon_time;
        tempObject.lastUpdated = traffic.last_updated;
        tempObjectTrack.latitude = traffic.latitude;
        tempObjectTrack.longitude = traffic.longitude;
        tempObjectTrack.altitude = traffic.altitude;
        tempObjectTrack.groundSpeed = traffic.groundspeed;
        tempObjectTrack.heading = traffic.heading;
        tempObjectTrack.qnhIhg = traffic.qnh_i_hg;
        tempObjectTrack.compensation = 0;
        if (trackFlag) {
            tempObject.track.push(tempObjectTrack);
            return tempObject;
        } else {
            delete tempObject.track;
            return tempObject;
        }
    }

    normalizeVatsimTraffic() {
        if (this.vatsimPilots.length > 0) {
            this.vatsimPilots.filter((p) => {
                if (this.#validateVatsimTraffic(p)) {
                    this.normalizedVatsimTraffics.push(this.#buildTrafficObject(p, true));
                }
            });
        }
        return this.normalizedVatsimTraffics;
    }

    async importVatsimTrafficToRedis(connectionUrl) {
        try {
            const normalizedTraffics = this.normalizeVatsimTraffic();
            const client = await new Client().open(connectionUrl);
            const repo = client.fetchRepository(vatsimTrafficsSchema);
            await repo.createIndex();
            normalizedTraffics.map(async (traffic) => {
                await repo.save(traffic);
            });
        } catch (e) {
            console.error("redis error:", e);
        }
    }

    #trackCompensation(latestTrack, dbTrack) {
        // If latestTrack return groundSpeed as 0, don't push new track, only update the flight info
        // If latestTrack has the same heading with dbTrack, don't update track, only increment compensation number
        // Otherwise push the coordinates to new track
        if (latestTrack.track.at(-1).groundSpeed === 0) {
            return latestTrack;
        } else if (latestTrack.track.at(-1).heading === dbTrack.track.at(-1).heading) {
            const tempObject = { ...dbTrack };
            tempObject.track.at(-1).compensation = dbTrack.track.at(-1).compensation + 1;
            return tempObject;
        } else {
            const tempObject = { ...dbTrack };
            tempObject.track.push(latestTrack.track[0]);
            return tempObject;
        }
    }

    /* *
     trackClient: the Redis client that contains all track for every traffic
     noTrackClient: the redis client that only contains the latest track
     * */
    async updateVatsimTrafficRedis(trackClient, noTrackClient) {
        try {
            await this.requestVatsimData();
            const updatedTraffic = this.normalizeVatsimTraffic();

            if (!trackClient || !noTrackClient) {
                throw new Error("Redis Connect Failed");
            }
            const trafficRepo = trackClient.fetchRepository(vatsimTrafficsSchema);
            const trafficNoTrackRepo = noTrackClient.fetchRepository(vatsimTrafficsSchema);

            //remove traffics that are not in the latest fetched data
            const allRedisTrafficsNoTrack = await trafficNoTrackRepo.search().all();
            allRedisTrafficsNoTrack.map(async (p) => {
                if (!_.find(updatedTraffic, { cid: p.cid })) {
                    await trafficNoTrackRepo.remove(p[EntityId]);
                }
            });

            const allRedisTraffics = await trafficRepo.search().all();
            allRedisTraffics.map(async (p) => {
                if (!_.find(updatedTraffic, { cid: p.cid })) {
                    await trafficRepo.remove(p[EntityId]);
                }
            });

            updatedTraffic.map(async (pilot) => {
                const noTrackEntity = await trafficNoTrackRepo
                    .search()
                    .where("cid")
                    .eq(pilot.cid)
                    .returnFirst();
                const trackEntity = await trafficRepo
                    .search()
                    .where("cid")
                    .eq(pilot.cid)
                    .returnFirst();
                if (noTrackEntity) {
                    await trafficNoTrackRepo.save(noTrackEntity[EntityId], pilot);
                } else {
                    await trafficNoTrackRepo.save(pilot);
                }
                if (trackEntity) {
                    const compensationTrack = this.#trackCompensation(pilot, trackEntity);
                    if (!compensationTrack) {
                        return;
                    } else {
                        await trafficRepo.save(trackEntity[EntityId], compensationTrack);
                    }
                } else {
                    await trafficRepo.save(this.#buildTrafficObject(pilot, true));
                }
            });
            console.log("vatsim traffics updated");
        } catch (e) {
            console.error("redis error:", e);
        }
    }

    async getAllVatsimTraffics(client) {
        try {
            if (!client) {
                throw new Error("Redis Connect Failed");
            }
            const repo = client.fetchRepository(vatsimTrafficsSchema);

            //remove traffics that are not in the latest fetched data
            const allRedisTraffics = await repo.search().all();
            if (allRedisTraffics) {
                return allRedisTraffics;
            } else {
                return null;
            }
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    getVatsimPilots() {
        if (this.vatsimPilots.length > 0) {
            return this.vatsimPilots;
        }
        return [];
    }
}

module.exports = VatsimData;
