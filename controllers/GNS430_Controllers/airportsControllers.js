const { GNS430Airport } = require("../../models/airports/GNS430_model/gns430AirportsModel");
const NotFoundError = require("../../common/errors/NotFoundError");
const APIFeatures = require("../../utils/Data_Convert/apiFeatures");
const { Airports } = require("../../models/airports/airportsModel");
const { generateGeneralATIS } = require("../../utils/ATIS/generateFaaAndVatsimATIS");
const { checkICAO } = require("../../utils/checkICAO");
const {
    GNS430Airport_Update
} = require("../../models/airports/GNS430_model/updateGns430AirportModel");
const { getAwcMetarUsingICAO } = require("../../utils/AWC_Weather/controller_helper");
const RedisClient = require("../../redis/RedisClient");
const { awcMetarSchema } = require("../../redis/awcMetar");
const { AwcWeatherMetarModel } = require("../../models/weather/awcWeatherModel");

const earthRadiusInNauticalMile = 3443.92;
const earthRadiusInKM = 6378.1;

const rClient = new RedisClient();
let repo;
(async () => {
    await rClient.openNewRedisOMClient(process.env.REDISCLOUD_URL);
    repo = rClient.createRedisOMRepository(awcMetarSchema);
})();

//! header remove

module.exports.getAirportByICAO_GNS430_Basic = async (req, res) => {
    const gns430Airport = await GNS430Airport_Update.findOne({
        ICAO: `${req.params.icao.toUpperCase()}`
    });
    console.log(gns430Airport);

    if (gns430Airport) {
        return res.status(200).json({
            results: gns430Airport.length,
            data: gns430Airport
        });
    } else {
        return res.status(200).json({
            results: 0,
            data: []
        });
    }
};

module.exports.getAirportByICAO_GNS430 = async (req, res) => {
    let decode = req.query.decode === "true";

    const airportFeatures = new APIFeatures(
        GNS430Airport_Update.findOne({ ICAO: `${req.params.icao.toUpperCase()}` }),
        req.query
    )
        .filter()
        .limitFields();

    airportFeatures.query = airportFeatures.query.populate({ path: "comments" });
    const gns430Airport = await airportFeatures.query;

    if (!gns430Airport || gns430Airport.length === 0) {
        return res.status(200).json({
            results: 0,
            data: []
        });
    } else {
        let responseObject = {};
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

        responseObject.airport = gns430Airport;

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
        let responseObject = { airport: gns430Airport };
        let icao = gns430Airport[0].ICAO;
        const ATIS = await generateGeneralATIS(icao);
        const responseMetar = await getAwcMetarUsingICAO(icao, decode, AwcWeatherMetarModel, repo);

        if (Object.keys(ATIS).length !== 0) {
            responseObject.ATIS = ATIS;
        }

        if (responseMetar && responseMetar.length !== 0) {
            responseObject.responseMetar = responseMetar;
        }

        return res.status(200).json({
            results: 1,
            data: responseObject
        });
    }
};

module.exports.getAirportByName_GNS430 = async (req, res) => {
    const airportQueryObj = GNS430Airport_Update.find({
        "station.name": { $regex: `${req.params.name}`, $options: "i" }
    });

    const featuresQuery = new APIFeatures(airportQueryObj, req.query)
        .filter()
        .limitFields()
        .limitResults();

    const airportsResponse = await featuresQuery.query;

    if (!airportsResponse || airportsResponse.length === 0) {
        return res.status(200).json({
            results: 0,
            data: []
        });
    } else {
        return res.status(200).json({
            results: airportsResponse.length,
            data: airportsResponse
        });
    }
};

module.exports.getAirportsByCity_GNS430 = async (req, res) => {
    const airportQueryObj = GNS430Airport_Update.find({
        "station.city": { $regex: `${req.params.name}`, $options: "i" }
    });

    const airportFeatures = new APIFeatures(airportQueryObj, req.query)
        .filter()
        .limitFields()
        .limitResults();

    const airportsResponse = await airportFeatures.query;

    res.status(200).json({
        results: airportsResponse.length,
        data: airportsResponse
    });
};

module.exports.getAirportByGenericInput_GNS430 = async (req, res) => {
    // If checkICAO return true, check ICAO first
    const userInput = req.params.data;
    let airports = [];
    let filteredAirports = [];
    let responseAirports = [];

    if (checkICAO(userInput)) {
        const airportFeature = new APIFeatures(
            GNS430Airport.findOne({
                ICAO: userInput.toUpperCase()
            }),
            req.query
        )
            .filter()
            .limitFields();

        const airportsWithICAO = await airportFeature.query;

        if (airportsWithICAO) {
            res.status(200).json({
                results: airportsWithICAO.length,
                data: airportsWithICAO
            });
        }
    } else {
        const airportsWithGNS430 = await GNS430Airport.find({
            $or: [
                { ICAO: `${userInput.toUpperCase()}` },
                { name: { $regex: `${userInput}`, $options: "i" } }
            ]
        });

        const airportWithCity = await Airports.find({
            municipality: { $regex: `${userInput}`, $options: "i" }
        });

        await Promise.all(
            airportWithCity.map(async (airport) => {
                const matchedAirport = await GNS430Airport.findOne({ ICAO: `${airport.ident}` });
                if (matchedAirport) {
                    filteredAirports.push(matchedAirport);
                }
            })
        );

        airports = [...filteredAirports, ...airportsWithGNS430];
        responseAirports = airports.filter((value, index, self) => {
            return (
                index ===
                self.findIndex((t) => {
                    return t.ICAO === value.ICAO;
                })
            );
        });
        res.status(200).json({
            results: responseAirports.length,
            data: responseAirports
        });
    }
};

module.exports.getAirportWithin = async (req, res) => {
    const { icao, distance, unit } = req.params;
    const originAirport = await GNS430Airport.findOne({ ICAO: `${icao.toUpperCase()}` });

    if (originAirport === null) {
        throw new NotFoundError(`Airport with ICAO: ${icao.toUpperCase()} not found`);
    }

    const [lng, lat] = originAirport.location.coordinates;
    const radius =
        unit === "km" ? distance / earthRadiusInKM : distance / earthRadiusInNauticalMile;

    const targetAirports = await GNS430Airport.find({
        location: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radius]
            }
        }
    });

    res.status(200).json({
        results: targetAirports.length,
        data: targetAirports
    });
};

const deg2rad = (deg) => deg * (Math.PI / 180);

const getDistanceFromLatLonInKm = (originLng, originLat, desLng, desLat) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(originLat - desLat); // deg2rad below
    const dLon = deg2rad(originLng - desLng);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(originLat)) *
            Math.cos(deg2rad(desLat)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

module.exports.getAirportsDistance = async (req, res) => {
    const { originICAO, destinationICAO, unit } = req.params;

    const originAirport = await GNS430Airport.findOne({ ICAO: `${originICAO.toUpperCase()}` });
    if (originAirport === null) {
        throw new NotFoundError(`Airport with ICAO: ${originICAO.toUpperCase()} not found.`);
    }

    const destinationAirport = await GNS430Airport.findOne({
        ICAO: `${destinationICAO.toUpperCase()}`
    });
    if (destinationAirport === null) {
        throw new NotFoundError(`Airport with ICAO: ${destinationICAO.toUpperCase()} not found.`);
    }

    const [originLng, originLat] = originAirport.location.coordinates;
    const [destinationLng, destinationLat] = destinationAirport.location.coordinates;

    const calculatedDistance = getDistanceFromLatLonInKm(
        originLng,
        originLat,
        destinationLng,
        destinationLat
    );
    const distance = unit === "km" ? calculatedDistance : calculatedDistance * 0.539957;

    res.status(200).json({
        data: {
            distance: distance.toFixed(1)
        }
    });
};
