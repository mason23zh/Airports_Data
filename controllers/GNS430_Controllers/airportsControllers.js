const APIFeatures = require("../../utils/Data_Convert/apiFeatures");
const { generateGeneralATIS } = require("../../utils/ATIS/generateFaaAndVatsimATIS");
const {
    GNS430Airport_Update
} = require("../../models/airports/GNS430_model/updateGns430AirportModel");
const { ShareAirport } = require("../../models/airports/shareAirportModel");
const { getAwcMetarUsingICAO } = require("../../utils/AWC_Weather/controller_helper");
const RedisClient = require("../../redis/RedisClient");
const { awcMetarSchema } = require("../../redis/awcMetar");
const { AwcWeatherMetarModel } = require("../../models/weather/awcWeatherModel");
const { getDistanceFromLatLonInKm } = require("./converter");
const axios = require("axios");
const VatsimData = require("../../utils/Vatsim_data/VatsimData");
const OnlineFlightData = require("../../utils/Online_Flight_Data/OnlineFlightData");
const earthRadiusInNauticalMile = 3443.92;
const earthRadiusInKM = 6378.1;

const rClient = new RedisClient();

(async () => {
    await rClient.createRedisNodeConnection(process.env.REDISCLOUD_METAR_URL);
})();

module.exports.getAirportByICAO_GNS430_Basic = async (req, res) => {
    const gns430Airport = await GNS430Airport_Update.findOne({
        ICAO: `${req.params.icao.toUpperCase()}`
    });

    res.status(200).json({
        results: 1,
        data: [gns430Airport]
    });
};

module.exports.getAirportByICAO_GNS430 = async (req, res) => {
    let decode = req.query.decode === "true";

    const gns430Airport = await GNS430Airport_Update.findOne({
        ICAO: `${req.params.icao.toUpperCase()}`
    });

    if (!gns430Airport) {
        return res.status(200).json({
            results: 0,
            data: []
        });
    } else {
        const repo = rClient.createRedisRepository(awcMetarSchema);
        let responseObject = { airport: gns430Airport };
        const responseMetar = await getAwcMetarUsingICAO(
            req.params.icao.toUpperCase(),
            decode,
            AwcWeatherMetarModel,
            repo
        );

        const ATIS = await generateGeneralATIS(req.params.icao.toUpperCase());

        if (responseMetar && responseMetar.length !== 0) {
            responseObject.METAR = responseMetar;
        }

        if (Object.keys(ATIS).length !== 0) {
            responseObject.ATIS = ATIS;
        }

        return res.status(200).json({
            results: 1,
            data: [responseObject]
        });
    }
};

//https://www.avionio.com/widget/en/TPE/departures
//! This is a temporary solution to by-pass the CORS issue in the frontend
// In order to avoid Avionic data error or data not available
module.exports.getAirportByICAO_GNS430_With_Widget = async (req, res) => {
    let decode = req.query.decode === "true";

    const gns430Airport = await GNS430Airport_Update.findOne({
        ICAO: `${req.params.icao.toUpperCase()}`
    });

    if (!gns430Airport) {
        return res.status(200).json({
            results: 0,
            data: []
        });
    } else {
        const repo = rClient.createRedisRepository(awcMetarSchema);
        let responseObject = { airport: gns430Airport };
        const responseMetar = await getAwcMetarUsingICAO(
            req.params.icao.toUpperCase(),
            decode,
            AwcWeatherMetarModel,
            repo
        );

        const ATIS = await generateGeneralATIS(req.params.icao.toUpperCase());

        // check if Avionio data is available
        if (gns430Airport[0].iata) {
            try {
                const avionioResponse = await axios.get(
                    `https://www.avionio.com/widget/en/${gns430Airport[0].iata}/departures`
                );
                if (avionioResponse.data && avionioResponse.data.length > 0) {
                    responseObject.widget = true;
                }
            } catch (e) {
                responseObject.widget = false;
            }
        }

        if (responseMetar && responseMetar.length !== 0) {
            responseObject.METAR = responseMetar;
        }

        if (Object.keys(ATIS).length !== 0) {
            responseObject.ATIS = ATIS;
        }

        return res.status(200).json({
            results: 1,
            data: [responseObject]
        });
    }
};

module.exports.getAirportByIATA_GNS430 = async (req, res) => {
    let decode = req.query.decode === "true";
    let { iata } = req.params;

    const airportFeatures = new APIFeatures(
        GNS430Airport_Update.findOne({ iata: iata.toUpperCase() }),
        req.query
    )
        .filter()
        .limitFields();

    const gns430Airport = await airportFeatures.query;

    if (!gns430Airport || gns430Airport.length === 0) {
        return res.status(200).json({
            results: 0,
            data: []
        });
    } else {
        const repo = rClient.createRedisRepository(awcMetarSchema);
        let responseObject = { airport: gns430Airport[0] };
        let icao = gns430Airport[0].ICAO;
        const ATIS = await generateGeneralATIS(icao);
        const responseMetar = await getAwcMetarUsingICAO(icao, decode, AwcWeatherMetarModel, repo);

        if (Object.keys(ATIS).length !== 0) {
            responseObject.ATIS = ATIS;
        }

        if (responseMetar && responseMetar.length !== 0) {
            responseObject.METAR = responseMetar;
        }

        return res.status(200).json({
            results: 1,
            data: [responseObject]
        });
    }
};

module.exports.getAirportsByName_Paginate = async (req, res) => {
    let limit = 10;
    let page = 1;
    if (req.query.page && !isNaN(Number(req.query.page))) {
        page = Number(req.query.page);
    }
    if (req.query.limit && !isNaN(Number(req.query.limit))) {
        limit = Number(req.query.limit);
    }

    const aggregateAirports = GNS430Airport_Update.aggregate([
        {
            $search: {
                text: {
                    query: `${req.params.name}`,
                    path: "station.name"
                }
            }
        },
        {
            $project: {
                _id: 0,
                id: 0,
                __v: 0,
                "runways._id": 0
            }
        }
    ]);

    try {
        const responseAirports = await GNS430Airport_Update.aggregatePaginate(aggregateAirports, {
            page: page,
            limit: limit,
            customLabels: { docs: "airports", totalDocs: "totalAirports" }
        });

        res.status(200).json({
            data: responseAirports
        });
    } catch (e) {
        res.status(200).json({
            data: {
                airports: []
            }
        });
    }
};

module.exports.getAirportsByName_GNS430 = async (req, res) => {
    let limitResults = 10;
    if (req.query.limitResults && !isNaN(Number(req.query.limitResults))) {
        limitResults = Number(req.query.limitResults);
    }
    const airportsResponse = await GNS430Airport_Update.aggregate([
        {
            $search: {
                text: {
                    query: `${req.params.name}`,
                    path: "station.name"
                }
            }
        },
        {
            $project: {
                _id: 0,
                id: 0,
                __v: 0,
                "runways._id": 0
            }
        }
    ]).limit(limitResults);

    res.status(200).json({
        results: airportsResponse.length,
        data: airportsResponse
    });
};

module.exports.getAirportByRegion_Paginate = async (req, res) => {
    let limit = 10;
    let page = 1;
    if (req.query.page && !isNaN(Number(req.query.page))) {
        page = Number(req.query.page);
    }
    if (req.query.limit && !isNaN(Number(req.query.limit))) {
        limit = Number(req.query.limit);
    }

    const aggregateAirports = GNS430Airport_Update.aggregate([
        {
            $search: {
                text: {
                    query: `${req.params.region}`,
                    path: ["station.city", "station.region.region_name"]
                }
            }
        },
        {
            $project: {
                _id: 0,
                id: 0,
                __v: 0,
                "runways._id": 0
            }
        }
    ]);

    try {
        const responseAirports = await GNS430Airport_Update.aggregatePaginate(aggregateAirports, {
            page: page,
            limit: limit,
            customLabels: { docs: "airports", totalDocs: "totalAirports" }
        });

        res.status(200).json({
            data: responseAirports
        });
    } catch (e) {
        res.status(200).json({
            data: {
                airports: []
            }
        });
    }
};

module.exports.getAirportsByRegion_GNS430 = async (req, res) => {
    let limitResults = 10;
    if (req.query.limitResults && !isNaN(Number(req.query.limitResults))) {
        limitResults = Number(req.query.limitResults);
    }

    const airportsResponse = await GNS430Airport_Update.aggregate([
        {
            $search: {
                text: {
                    query: `${req.params.name}`,
                    path: ["station.city", "station.region.region_name"]
                }
            }
        },
        {
            $project: {
                _id: 0,
                id: 0,
                __v: 0,
                "runways._id": 0
            }
        }
    ]).limit(limitResults);

    res.status(200).json({
        results: airportsResponse.length,
        data: airportsResponse
    });
};

module.exports.getAirportsByCountry_Paginate = async (req, res) => {
    let limit = 10;
    let page = 1;
    if (req.query.page && !isNaN(Number(req.query.page))) {
        page = Number(req.query.page);
    }
    if (req.query.limit && !isNaN(Number(req.query.limit))) {
        limit = Number(req.query.limit);
    }

    const aggregateAirports = GNS430Airport_Update.aggregate([
        {
            $search: {
                text: {
                    query: `${req.params.country}`,
                    path: ["station.country.country_name", "station.country.country_code"]
                }
            }
        },
        {
            $project: {
                _id: 0,
                id: 0,
                __v: 0,
                "runways._id": 0
            }
        }
    ]);

    try {
        const responseAirports = await GNS430Airport_Update.aggregatePaginate(aggregateAirports, {
            page: page,
            limit: limit,
            customLabels: { docs: "airports", totalDocs: "totalAirports" }
        });

        res.status(200).json({
            data: responseAirports
        });
    } catch (e) {
        res.status(200).json({
            data: {
                airports: []
            }
        });
    }
};

module.exports.getAirportsByCountry = async (req, res) => {
    let limitResults = 10;
    if (req.query.limitResults && !isNaN(Number(req.query.limitResults))) {
        limitResults = Number(req.query.limitResults);
    }

    const responseAirports = await GNS430Airport_Update.aggregate([
        {
            $search: {
                text: {
                    query: `${req.params.country}`,
                    path: ["station.country.country_name", "station.country.country_code"]
                }
            }
        },
        {
            $project: {
                _id: 0,
                id: 0,
                __v: 0,
                "runways._id": 0
            }
        }
    ]).limit(limitResults);

    res.status(200).json({
        results: responseAirports.length,
        data: responseAirports
    });
};

module.exports.getAirportByGenericInput_GNS430 = async (req, res) => {
    let limitResults = 10;
    if (req.query.limitResults && !isNaN(Number(req.query.limitResults))) {
        limitResults = Number(req.query.limitResults);
    }

    const responseAirports = await GNS430Airport_Update.aggregate([
        {
            $search: {
                text: {
                    query: `${req.params.data}`,
                    path: [
                        "ICAO",
                        "iata",
                        "station.name",
                        "station.city",
                        "station.country.country_name",
                        "station.region.region_name"
                    ]
                }
            }
        },
        {
            $project: {
                _id: 0,
                id: 0,
                __v: 0,
                "runways._id": 0
            }
        }
    ]).limit(limitResults);

    res.status(200).json({
        results: responseAirports.length,
        data: responseAirports
    });
};

module.exports.getAirportByGenericInput_Paginate = async (req, res) => {
    let limit = 10;
    let page = 1;
    if (req.query.limit && !isNaN(Number(req.query.limit))) {
        limit = Number(req.query.limit);
    }
    if (req.query.page && !isNaN(Number(req.query.page))) {
        page = Number(req.query.page);
    }

    const aggregateAirports = GNS430Airport_Update.aggregate([
        {
            $search: {
                text: {
                    query: `${req.params.data}`,
                    path: [
                        "ICAO",
                        "iata",
                        "station.name",
                        "station.city",
                        "station.country.country_name",
                        "station.region.region_name"
                    ]
                }
            }
        },
        {
            $project: {
                _id: 0,
                id: 0,
                __v: 0,
                "runways._id": 0
            }
        }
    ]);

    try {
        const responseAirports = await GNS430Airport_Update.aggregatePaginate(aggregateAirports, {
            page: page,
            limit: limit,
            customLabels: { docs: "airports", totalDocs: "totalAirports" }
        });

        res.status(200).json({
            data: responseAirports
        });
    } catch (e) {
        res.status(200).json({
            data: {
                airports: []
            }
        });
    }
};

module.exports.getAirportWithin = async (req, res) => {
    const { icao, distance, unit } = req.params;
    let limitResults = 10;
    if (req.query.limitResults && !isNaN(Number(req.query.limitResults))) {
        limitResults = Number(req.query.limitResults);
    }

    const originAirport = await GNS430Airport_Update.findOne({ ICAO: `${icao.toUpperCase()}` });

    if (originAirport === null || originAirport.length === 0) {
        return res.status(200).json({
            results: 0,
            data: []
        });
    }

    const [lng, lat] = originAirport.station.geometry.coordinates;
    const radius =
        unit === "km" ? distance / earthRadiusInKM : distance / earthRadiusInNauticalMile;

    const targetAirports = await GNS430Airport_Update.find({
        "station.geometry": {
            $geoWithin: {
                $centerSphere: [[lng, lat], radius]
            }
        }
    }).limit(limitResults);

    res.status(200).json({
        results: targetAirports.length,
        data: targetAirports
    });
};

module.exports.getAirportsDistance = async (req, res) => {
    const { originICAO, destinationICAO, unit } = req.params;

    const originAirport = await GNS430Airport_Update.findOne({
        ICAO: `${originICAO.toUpperCase()}`
    });

    const destinationAirport = await GNS430Airport_Update.findOne({
        ICAO: `${destinationICAO.toUpperCase()}`
    });

    if (
        destinationAirport === null ||
        destinationAirport.length === 0 ||
        originAirport === null ||
        originAirport.length === 0
    ) {
        return res.status(200).json({
            results: 0,
            data: []
        });
    }

    const [originLng, originLat] = originAirport.station.geometry.coordinates;
    const [destinationLng, destinationLat] = destinationAirport.station.geometry.coordinates;

    const calculatedDistance = getDistanceFromLatLonInKm(
        originLng,
        originLat,
        destinationLng,
        destinationLat
    );
    const distance = unit === "km" ? calculatedDistance : calculatedDistance * 0.539957;

    res.status(200).json({
        data: {
            unit: unit === "km" ? "kilometers" : "nauticalmiles",
            distance: distance.toFixed(1)
        }
    });
};

module.exports.updateVisited = async (req, res) => {
    const { icao } = req.body;

    try {
        const gns430Airport = await GNS430Airport_Update.findOneAndUpdate(
            {
                ICAO: `${icao.toUpperCase()}`
            },
            {
                $inc: { visited: 1 }
            }
        );
        res.status(200).json({
            data: gns430Airport.visited
        });
    } catch (e) {
        res.status(400).json({
            message: "Update Airport Failed"
        });
    }
};

module.exports.getPopularAirports = async (req, res) => {
    const popularAirports = await GNS430Airport_Update.find().sort({ visited: -1 }).limit(10);
    res.status(200).json({
        data: popularAirports
    });
};

module.exports.getVatsimPopularAirports = async (req, res) => {
    const { limit = 10 } = req.query;
    const vatsimData = new VatsimData();

    try {
        await vatsimData.requestVatsimData();
        const popularAirports = await vatsimData.getPopularAirports(limit);

        let combinedAirports = popularAirports.combined;
        let responseArray = [];

        // find all targets airport in Database
        const vatPopularAirports = await GNS430Airport_Update.find({
            ICAO: { $in: popularAirports.sortingOrder }
        }).lean();

        if (vatPopularAirports) {
            // Map through the returned documents list
            responseArray = vatPopularAirports.map((dbAirport) => {
                // find arrival and departure count in combined airport array
                const tempAirport = combinedAirports.find((o) => o.ICAO === dbAirport.ICAO);
                if (tempAirport) {
                    // Check ATIS availability
                    // remove id fields in documents
                    delete dbAirport._id;
                    // construct new airport object to be returned
                    return {
                        ...dbAirport,
                        arrivalNumber: tempAirport.arrival,
                        departureNumber: tempAirport.departure,
                        controller: {
                            DEL: tempAirport.DEL,
                            GND: tempAirport.GND,
                            TWR: tempAirport.TWR,
                            APP: tempAirport.APP,
                            ATIS: tempAirport.ATIS
                        }
                    };
                }
            });
        }

        // re-sort the response array
        // Db query messed up the order of the original sorted array
        let sortedResponseArray = [];
        for (let ICAO of popularAirports.sortingOrder) {
            sortedResponseArray.push(responseArray.find((o) => o.ICAO === ICAO));
        }

        res.status(200).json({
            data: {
                airports: sortedResponseArray
            }
        });
    } catch (e) {
        res.status(200).json({
            airports: []
        });
    }
};

module.exports.getVatsimControllers = async (req, res) => {
    const { ICAO } = req.params;
    const vatsimData = new VatsimData();
    await vatsimData.requestVatsimData();
    const response = await vatsimData.onlineControllerStatus(ICAO);
    const atisFlag = vatsimData.checkATIS(ICAO);
    res.status(200).json({
        data: {
            controllers: { ...response, ATIS: atisFlag }
        }
    });
};

module.exports.getOnlineFlightData = async (req, res) => {
    const { ICAO } = req.params;
    const onlineFlight = new OnlineFlightData(ICAO.trim());
    try {
        await onlineFlight.getHTML();

        const departureData = onlineFlight.getDeparturesData();
        const arrivalData = onlineFlight.getArrivalsData();

        res.status(200).json({
            data: {
                departureCount: departureData.length,
                arrivalCount: departureData.length,
                departure: departureData,
                arrival: arrivalData
            }
        });
    } catch (e) {
        res.status(200).json({
            data: {}
        });
    }
};

module.exports.storeShareAirport = async (req, res) => {
    function generateRandomString(strLength) {
        const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
        let randomString = "";
        for (let i = 0; i < strLength; i++) {
            let rNum = Math.floor(Math.random() * chars.length);
            randomString += chars[rNum];
        }
        return randomString;
    }

    const randomString = generateRandomString(10);

    if (req.body && Object.keys(req.body).length !== 0) {
        try {
            const response = await ShareAirport.create({
                url: randomString,
                airport: JSON.stringify(req.body)
            });
            if (res) {
                res.status(201).json({ status: "success", url: response.url });
            }
        } catch (e) {
            return -1;
        }
    } else {
        res.status(200).json({ status: "fail" });
    }
};

module.exports.getShareAirport = async (req, res) => {
    const { uniqueURL } = req.params;
    if (uniqueURL && uniqueURL.length > 0) {
        try {
            const response = await ShareAirport.findOne({ url: uniqueURL });
            let tempObj = {
                url: response.url,
                airport: JSON.parse(response.airport)
            };

            res.status(200).json({
                data: tempObj
            });
        } catch (e) {
            return -1;
        }
    } else {
        res.status(200).json({ data: null });
    }
};
