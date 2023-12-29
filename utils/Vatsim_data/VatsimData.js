/* eslint-disable prettier/prettier */
require("dotenv").config({path: "../../config.env"});
const logger = require("../../logger/index");
const axios = require("axios");
const {VATSIM_DATA_URL, VATSIM_EVENTS_URL} = require("../../config");
const {VatsimEvents} = require("../../models/vatsim/vatsimEventsModel");
const {VatsimHistoryTraffics} = require("../../models/vatsim/vatsimHistoryTrafficsModel");
const BadRequestError = require("../../common/errors/BadRequestError");
const NotFoundError = require("../../common/errors/NotFoundError");
const {GNS430Airport} = require("../../models/airports/GNS430_model/gns430AirportsModel");
const {
    GNS430Airport_Update
} = require("../../models/airports/GNS430_model/updateGns430AirportModel");
const _ = require("lodash");
const {vatsimTrafficsSchema} = require("../../redis/vatsimTraffics");
const {batchProcess} = require("../../utils/batchProcess");

const RedisClient = require("../../redis/RedisClient");

class VatsimData {
    constructor() {
        this.normalizedVatsimTraffics = [];
        this.normalizedVatsimPrifiles = []
        this.vatsimPilots = [];
        this.vatsimPrefiles = [];
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
            const airport = await GNS430Airport_Update.findOne({ICAO: `${icao.toUpperCase()}`});
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
            logger.info("starting import vatsim events to db...");
            // delete all previous events
            await VatsimEvents.deleteMany({});
            const doc = await VatsimEvents.create(JSON.parse(JSON.stringify(this.vatsimEvents)));
            if (doc.length > 0) {
                logger.info("successfully import vatsim events to db ");
            }
            this.vatsimEvents = null;
            return doc.length;
        } catch (e) {
            logger.error("storeVatsimEventsToDB error:%O", e);
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
            logger.error("requestVatsimEventsData error:%O", e);
            throw new BadRequestError("Vatsim API ERROR");
        }
        return this;
    }

    async getAllVatsimEvents() {
        try {
            const currentTime = new Date(new Date()).toISOString();
            // filter out the events that already ended
            const docs = await VatsimEvents.find({end_time: {$gte: currentTime}});
            if (docs && docs.length > 0) {
                return docs;
            } else {
                return this.vatsimEvents;
            }
        } catch (e) {
            logger.error("getAllVatsimEvents error:%O", e);
            return [];
        }
    }

    async sortVatsimEventsByTime(timeFlag, order) {
        try {
            let docs;
            const currentTime = new Date(new Date()).toISOString();

            if (timeFlag === "start_time") {
                docs = await VatsimEvents.find({end_time: {$gte: currentTime}}).sort({
                    start_time: order
                });
            } else if (timeFlag === "end_time") {
                docs = await VatsimEvents.find({end_time: {$gte: currentTime}}).sort({
                    end_time: order
                });
            }
            if (docs && docs.length > 0) {
                return docs;
            }
        } catch (e) {
            logger.error("sortVatsimEventsByTime error:%O", e);
            return [];
        }
    }

    async getCurrentVatsimEvents() {
        try {
            const currentTime = new Date().getTime();
            const docs = await VatsimEvents.find({
                end_time: {$gte: new Date(new Date()).toISOString()}
            }).sort({start_time: 1});
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
            logger.error("getCurrentVatsimEvents error:%O", e);
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
                if (response.data.prefiles.length > 0) {
                    this.vatsimPrefiles = response.data.prefiles
                }
                return response;
            }
        } catch (e) {
            logger.error("requestVatsimData error:%O", e);
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
        const {vatsimPilots} = this;
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
                    depAirports.push({ICAO: pilot.flight_plan.departure});
                    arrAirports.push({ICAO: pilot.flight_plan.arrival});
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
                    let vatsimAtis = {data: {}};
                    vatsimAtis.data.code = atis.atis_code ? atis.atis_code : "-";
                    vatsimAtis.data.datis = atis.text_atis.join(" ");
                    return vatsimAtis;
                }
            }
            return {
                data: `No Vatsim ATIS found in ${icao.toUpperCase()}`
            };
        }
        return {data: "Vatsim API not available"};
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
        const controllerObject = {controllerList: []};
        if (controllerList.length > 0) {
            controllerList.forEach((controller) => {
                const controllerObj = {};
                controllerObj.callsign = controller.callsign;
                controllerObj.visual_range = controller.visual_range;
                controllerObject.controllerList.push(controllerObj);
            });
        }
        const airport = await GNS430Airport.findOne({ICAO: `${icao.toUpperCase()}`});
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
            logger.info("invalid flights:", flight);
            return false;
        }
        return true;
    }

    #buildTrafficObject(traffic, trackFlag) {
        const tempObject = {
            cid: traffic.cid,
            name: traffic.name,
            callsign: traffic.callsign,
            server: traffic.server,
            transponder: traffic.transponder,
            flightRules: traffic.flight_plan?.flight_rules ?? "N/A",
            aircraft: {
                full: traffic.flight_plan?.aircraft ?? "N/A",
                faa: traffic.flight_plan?.aircraft_faa ?? "N/A",
                short: traffic.flight_plan?.aircraft_short ?? "N/A"
            },
            arrival: traffic.flight_plan?.arrival ?? "N/A",
            departure: traffic.flight_plan?.departure ?? "N/A",
            alternate: traffic.flight_plan?.alternate ?? "N/A",
            depTime: traffic.flight_plan?.deptime ?? "N/A",
            enrouteTime: traffic.flight_plan?.enroute_time ?? "N/A",
            fuelTime: traffic.flight_plan?.fuel_time ?? "N/A",
            remarks: traffic.flight_plan?.remarks ?? "N/A",
            route: traffic.flight_plan?.route ?? "N/A",
            logonTime: traffic.logon_time,
            lastUpdated: traffic.last_updated
        };

        if (trackFlag) {
            tempObject.track = [{
                latitude: traffic.latitude ?? 0,
                longitude: traffic.longitude ?? 0,
                altitude: traffic.altitude ?? 0,
                groundSpeed: traffic.groundspeed ?? 0,
                heading: traffic.heading ?? 0,
                qnhIhg: traffic.qnh_i_hg,
                compensation: 0
            }];
        }

        return tempObject;
    }

    normalizeVatsimTraffic() {
        this.normalizedVatsimTraffics = this.vatsimPilots.reduce((acc, pilot) => {
            if (this.#validateVatsimTraffic(pilot)) {
                acc.push(this.#buildTrafficObject(pilot, true));
            }
            return acc;
        }, []);
        return this.normalizedVatsimTraffics;
    }

    //! This function will FLUSH the redis. Make sure connectionUrl is correct
    async importVatsimTrafficToRedis(connectionUrl) {
        // throw error if connectionUrl is production db url.
        if (connectionUrl === process.env.REDISCLOUD_VATSIM_TRAFFIC_URL) {
            logger.warn("importVatsimTrafficToRedis been called on production db.");
            throw new Error("production db connected.");
        }
        const vatsimRedisClient = new RedisClient();
        try {
            const normalizedTraffics = this.normalizeVatsimTraffic();
            await vatsimRedisClient.createRedisNodeConnection(connectionUrl);
            logger.info("redis client for vatsim traffic import connected.");
            //flush old redis data.
            await vatsimRedisClient.flushDb();
            logger.info("redis db for vatsim traffic flushed.");
            const repo = vatsimRedisClient.createRedisRepository(vatsimTrafficsSchema);
            await repo.createIndex();
            const promiseArray = normalizedTraffics.map((traffic) => {
                if (!traffic.cid) return;
                return repo.save(`${traffic.cid}`, traffic);
            });
            await batchProcess(promiseArray, 100);
            try {
                await vatsimRedisClient.closeConnection();
                logger.info("vatsim traffics imported to redis.");
            } catch (e) {
                logger.error("redis connection close failed:", e);
            }
        } catch (e) {
            logger.error("importVatsimTrafficToRedis error:", e);
        }
    }

    #trackCompensation(latestTrack, dbTrack) {
        // If latestTrack return groundSpeed as 0, don't push new track, only update the flight info
        // If latestTrack has the same heading with dbTrack, don't update track, only increment compensation number
        // Otherwise push the coordinates to new track
        if (latestTrack.track.at(-1).groundSpeed === 0) {
            return latestTrack;
        } else if (latestTrack.track.at(-1).heading === dbTrack.track.at(-1).heading) {
            const tempObject = {...latestTrack, track: dbTrack.track};
            tempObject.track.at(-1).compensation += 1;
            return tempObject;
        } else {
            dbTrack.track.push(latestTrack.track[0]);
            return {...latestTrack, track: dbTrack.track};
        }
    }

    /*
     A generator function to return the db array in batch.
     * */
    async* paginatedSearch(repository, pageSize = 100) {
        let offset = 0;
        let results;
        let keepGoing = true;

        while (keepGoing) {
            try {
                results = await repository.search().page(offset, pageSize);
                if (results.length === 0 || results.length < pageSize) {
                    keepGoing = false;
                }
                yield results;
                offset += pageSize; // Increment the offset for the next page
            } catch (error) {
                logger.error(`Error fetching page at offset ${offset}:`, error);
                keepGoing = false;
            }
        }
    }

    /* *
     trackClient: the Redis client that contains all track for every traffic
     noTrackClient: the redis client that only contains the latest track
     * */
    async updateVatsimTrafficRedis(trackClient) {
        try {
            await this.requestVatsimData();
            this.normalizeVatsimTraffic();

            const trafficRepo = trackClient.createRedisRepository(vatsimTrafficsSchema);
            if (!trafficRepo) {
                throw new Error("Failed to fetch Redis repo");
            }

            const entityToRemove = new Set();

            for await (const page of this.paginatedSearch(trafficRepo)) {
                page.forEach((p) => {
                    if (!_.find(this.normalizedVatsimTraffics, {cid: p.cid})) {
                        entityToRemove.add(`${p.cid}`);
                    }
                });
            }
            logger.debug("Entity to be removed:%O", entityToRemove);

            // logger.debug("Traffic to be removed:%O", trafficToBeRemoved);
            const trafficPromise = this.normalizedVatsimTraffics.map(async (pilot) => {
                const trackEntity = await trafficRepo
                    .search()
                    .where("cid")
                    .eq(pilot.cid)
                    .returnFirst();
                if (trackEntity) {
                    const compensationTrack = this.#trackCompensation(pilot, trackEntity);
                    return trafficRepo.save(`${pilot.cid}`, compensationTrack);
                } else {
                    return trafficRepo.save(`${pilot.cid}`, this.#buildTrafficObject(pilot, true));
                }
            });
            this.normalizedVatsimTraffics = null;

            trafficPromise.push(trafficRepo.remove(Array.from(entityToRemove)));
            await batchProcess(trafficPromise, 30);
            logger.debug("MEMORY AFTER UPDATE:%O", process.memoryUsage());
        } catch (e) {
            logger.error("updateVatsimTrafficRedis error:%O", e);
        }
    }

    async getAllVatsimTraffics(client) {
        try {
            if (!client) {
                throw new Error("Redis Connect Failed");
            }
            const repo = client.createRedisRepository(vatsimTrafficsSchema);

            //remove traffics that are not in the latest fetched data
            const allRedisTraffics = await repo.search().all();
            if (allRedisTraffics) {
                return allRedisTraffics;
            } else {
                return null;
            }
        } catch (e) {
            logger.error("getAllVatsimTraffics error:", e);
            return null;
        }
    }

    getVatsimPilots() {
        if (this.vatsimPilots.length > 0) {
            return this.vatsimPilots;
        }
        return [];
    }

    normalizeVatsimPrefiles() {
        this.normalizedVatsimPrifiles = this.vatsimPrefiles.reduce((acc, pilot) => {
            if (pilot.cid && pilot.cid !== 0) {
                acc.push(this.#buildTrafficObject(pilot, false));
            }
            return acc;
        }, []);
        this.vatsimPrefiles = [];
        return this.normalizedVatsimPrifiles;
    }

    async updateVatsimHistoryTraffic() {
        try {
            this.normalizeVatsimPrefiles();
            const updateQuires = []
            this.normalizedVatsimPrifiles.forEach((traffic) => {
                updateQuires.push(
                    {
                        updateOne: {
                            filter: {
                                cid: traffic.cid
                            },
                            update: traffic,
                            upsert: true
                        }
                    }
                )
            })
            await VatsimHistoryTraffics.bulkWrite(updateQuires)
            this.normalizedVatsimPrifiles = [];
        } catch (e) {
            logger.error("Error update vatsim history traffic: %O", e)
        }
    }


}

module.exports = VatsimData;
