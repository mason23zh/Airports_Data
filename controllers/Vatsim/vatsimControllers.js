const VatsimData = require("../../utils/Vatsim_data/VatsimData");
const { vatsimTrafficsSchema } = require("../../redis/vatsimTraffics");
const RedisClient = require("../../redis/RedisClient");
const logger = require("../../logger/index");
const path = require("path");

const vatsimRedisClient = new RedisClient();
const REDIS_VATSIM_URL =
    process.env.NODE_ENV === "production"
        ? process.env.REDISCLOUD_VATSIM_TRAFFIC_URL
        : process.env.REDISCLOUD_VATSIM_TRAFFIC_DEV;
(async () => {
    //process.env.REDISCLOUD_VATSIM_TRAFFIC_NO_TRACK_URL
    await vatsimRedisClient.createRedisNodeConnection(REDIS_VATSIM_URL);
})();

module.exports.getVatsimEvents = async (req, res) => {
    const vatsimData = new VatsimData();
    const response = await vatsimData.getAllVatsimEvents();

    res.status(200).json({
        results: response.length,
        events: response
    });
};

module.exports.sortVatsimEventsByTime = async (req, res) => {
    let { target } = req.query;
    let { sort } = req.query;
    if (!target || target.length === 0) {
        target = "start_time";
    } else if (target !== "start" || target !== "end") {
        target = "start_time";
    } else if (target.includes("start")) {
        target = "start_time";
    } else if (target.includes("end")) {
        logger.debug("trigger");
        target = "end_time";
    }
    if (!req.query.sort || (req.query.sort !== "-1" && req.query.sort !== "1")) {
        sort = 1;
    } else if (req.query.sort === "1") {
        sort = 1;
    } else if (req.query.sort === "-1") {
        sort = -1;
    }

    const vatsimData = new VatsimData();
    const sortedEvents = await vatsimData.sortVatsimEventsByTime(target, sort);

    res.status(200).json({
        results: sortedEvents.length,
        events: sortedEvents
    });
};

module.exports.getCurrentVatsimEvents = async (req, res) => {
    const vatsimData = new VatsimData();
    const currentEvents = await vatsimData.getCurrentVatsimEvents();
    res.status(200).json({
        results: currentEvents.length,
        events: currentEvents
    });
};

module.exports.importToDB = async (req, res) => {
    const vatsimData = (await new VatsimData()).requestVatsimEventsData();
    const result = await (await vatsimData).storeVatsimEventsToDB();
    res.status(200).json({
        data: result
    });
};

module.exports.getVatsimPilots = async (req, res) => {
    let vatsimPilots;
    const vatsim = new VatsimData();
    const vatsimData = await vatsim.requestVatsimData();
    if (vatsimData) {
        vatsimPilots = vatsim.getVatsimPilots();
    }
    res.status(200).json({
        data: {
            results: vatsimPilots.length,
            pilots: vatsimPilots
        }
    });
};

module.exports.getVatsimTrafficByCID = async (req, res) => {
    try {
        const repo = vatsimRedisClient.createRedisRepository(vatsimTrafficsSchema);
        const results = await repo.search().where("cid").eq(Number(req.params.cid)).returnFirst();
        res.status(200).json({
            data: results
        });
    } catch (e) {
        res.status(200).json({
            data: {}
        });
    }
};

module.exports.getVatsimTrafficByCID_Track = async (req, res) => {
    try {
        const repo = vatsimRedisClient.createRedisRepository(vatsimTrafficsSchema);
        const results = await repo.search().where("cid").eq(Number(req.params.cid)).returnFirst();
        res.status(200).json({
            data: results
        });
    } catch (e) {
        res.status(200).json({
            data: {}
        });
    }
};

module.exports.getVatsimTrafficByCallsign = async (req, res) => {
    try {
        const repo = vatsimRedisClient.createRedisRepository(vatsimTrafficsSchema);
        const results = await repo.search().where("callsign").eq(req.params.callsign).returnFirst();
        res.status(200).json({
            data: results
        });
    } catch (e) {
        res.status(200).json({
            data: {}
        });
    }
};

module.exports.getVatsimTrafficByCallsign_Track = async (req, res) => {
    try {
        const repo = vatsimRedisClient.createRedisRepository(vatsimTrafficsSchema);
        const results = await repo.search().where("callsign").eq(req.params.callsign).returnFirst();
        res.status(200).json({
            data: results
        });
    } catch (e) {
        res.status(200).json({
            data: {}
        });
    }
};

module.exports.getVatsimTraffics_Track = async (req, res) => {
    const vatsim = new VatsimData();
    const vatsimTraffics = await vatsim.getAllVatsimTraffics(vatsimRedisClient);
    if (!vatsimTraffics) {
        res.status(200).json({
            data: {
                results: 0,
                traffics: []
            }
        });
    } else {
        res.status(200).json({
            data: {
                results: vatsimTraffics.length,
                traffics: vatsimTraffics
            }
        });
    }
};

module.exports.getVatsimTraffics = async (req, res) => {
    const vatsim = new VatsimData();
    const vatsimTraffics = await vatsim.getAllVatsimTraffics(vatsimRedisClient);
    if (!vatsimTraffics) {
        res.status(200).json({
            data: {
                results: 0,
                traffics: []
            }
        });
    } else {
        res.status(200).json({
            data: {
                results: vatsimTraffics.length,
                traffics: vatsimTraffics
            }
        });
    }
};

//!Import vatsim traffics to redis db
//!Internal use only, only run once if redis db is empty
module.exports.importVatsimToRedis = async (req, res) => {
    const vatsim = new VatsimData();
    try {
        const vatsimData = await vatsim.requestVatsimData();
        if (vatsimData) {
            await vatsim.importVatsimTrafficToRedis(process.env.REDISCLOUD_VATSIM_TRAFFIC_DEV);
        }
        res.status(200).json({});
    } catch (e) {
        logger.error("Import Vatsim traffic to Redis failed:%O", e);
        res.status(500).json({});
    }
};

module.exports.findEmptyTrack = async (req, res) => {
    const vatsim = new VatsimData();
    try {
        const vatsimTraffics = await vatsim.getAllVatsimTraffics(vatsimRedisClient);
        let tempRes = [];
        if (vatsimTraffics) {
            tempRes = vatsimTraffics.filter((t) => {
                return Object.keys(t.track[0]).length === 1;
            });
        }
        res.status(200).json({
            miss: tempRes
        });
    } catch (e) {
        res.status(500);
    }
};

module.exports.updatePrefileTrafficsToDb = async (req, res) => {
    try {
        const vatsim = new VatsimData();
        await vatsim.requestVatsimData();
        await vatsim.updateVatsimHistoryTraffic();
        res.status(200).json({ results: "DONE" });
    } catch (e) {
        res.status(200).json({ error: e });
    }
};

module.exports.getVatsimControllers = async (req, res) => {
    try {
        const vatsim = new VatsimData();
        await vatsim.requestVatsimData();
        await vatsim.getVatsimFir();
        await vatsim.getOtherControllers();
        await vatsim.getVatsimFss();
        res.status(200).json({
            fir: vatsim.vatsimFir,
            other: vatsim.vatsimOtherControllers,
            fss: vatsim.vatsimFSS
        });
    } catch (e) {
        res.status(200).json({});
    }
};

module.exports.getVatsimFir = async (req, res) => {
    try {
        const vatsim = new VatsimData();
        await vatsim.requestVatsimData();
        await vatsim.getVatsimFir();
        res.status(200).json({ results: vatsim.vatsimFir });
    } catch (e) {
        res.status(200).json({ results: [] });
    }
};

module.exports.getVatsimOtherControllers = async (req, res) => {
    try {
        const vatsim = new VatsimData();
        await vatsim.requestVatsimData();
        await vatsim.getOtherControllers();
        res.status(200).json({ results: vatsim.vatsimOtherControllers });
    } catch (e) {
        res.status(200).json({ results: [] });
    }
};

module.exports.getVatsimFSS = async (req, res) => {
    try {
        const vatsim = new VatsimData();
        await vatsim.requestVatsimData();
        await vatsim.getVatsimFss();
        res.status(200).json({ results: vatsim.vatsimFSS });
    } catch (e) {
        res.status(200).json({ results: [] });
    }
};

//server fir json files
module.exports.getVatsimFirFile = async (req, res) => {
    const filePath = path.join(__dirname, "../../Data/Vatsim/vatsim-firs.json");
    res.sendFile(filePath, (err) => {
        if (err) {
            if (err.code === "ENOENT") {
                res.status(404).send("File Not Found.");
            } else {
                res.status(500).send("Server Error.");
            }
        }
    });
};

// const filepath = require("../../Data/Vatsim/vatsim-firboundaries.json")
module.exports.getVatsimFirBoundariesFile = async (req, res) => {
    const filePath = path.join(__dirname, "../../Data/Vatsim/vatsim-firboundaries.json");
    res.sendFile(filePath, (err) => {
        if (err) {
            if (err.code === "ENOENT") {
                res.status(404).send("File Not Found.");
            } else {
                res.status(500).send("Server Error.");
            }
        }
    });
};

module.exports.getVatsimUirsFile = async (req, res) => {
    const filePath = path.join(__dirname, "../../Data/Vatsim/vatsim-uirs.json");
    res.sendFile(filePath, (err) => {
        if (err) {
            if (err.code === "ENOENT") {
                res.status(404).send("File Not Found.");
            } else {
                res.status(500).send("Server Error.");
            }
        }
    });
};

// module.exports.updateVatsimTrafficToRedis = async (req, res) => {
//     const vatsimRedisClient = await new Client().open(process.env.REDISCLOUD_VATSIM_TRAFFIC_DEV);
//     const vatsim = new VatsimData();
//     try {
//         await vatsim.updateVatsimTrafficRedis(vatsimRedisClient);
//         res.status(200).json({});
//     } catch (e) {
//         res.status(500).json({});
//     }
// };
