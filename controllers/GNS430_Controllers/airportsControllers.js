const iso3166 = require("iso-3166-2");
const APIFeatures = require("../../utils/Data_Convert/apiFeatures");
const { generateGeneralATIS } = require("../../utils/ATIS/generateFaaAndVatsimATIS");
const {
    GNS430Airport_Update
} = require("../../models/airports/GNS430_model/updateGns430AirportModel");
const { getAwcMetarUsingICAO } = require("../../utils/AWC_Weather/controller_helper");
const RedisClient = require("../../redis/RedisClient");
const { awcMetarSchema } = require("../../redis/awcMetar");
const { AwcWeatherMetarModel } = require("../../models/weather/awcWeatherModel");
const { getDistanceFromLatLonInKm } = require("./converter");
const { ISO_3166_Data } = require("../../models/ISO_CountryModel/ISO_3166_2_model");

const earthRadiusInNauticalMile = 3443.92;
const earthRadiusInKM = 6378.1;

const rClient = new RedisClient();
let repo;
(async () => {
    await rClient.openNewRedisOMClient(process.env.REDISCLOUD_URL);
    repo = rClient.createRedisOMRepository(awcMetarSchema);
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
        let responseObject = { airport: gns430Airport[0] };
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

module.exports.getAirportByName_GNS430 = async (req, res) => {
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

module.exports.getAirportsByCity_GNS430 = async (req, res) => {
    let limitResults = 10;
    if (req.query.limitResults && !isNaN(Number(req.query.limitResults))) {
        limitResults = Number(req.query.limitResults);
    }

    const airportsResponse = await GNS430Airport_Update.aggregate([
        {
            $search: {
                text: {
                    query: `${req.params.name}`,
                    path: "station.city"
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

module.exports.getAirportsByCountry = async (req, res) => {
    const test = await ISO_3166_Data.findOne({ regionCode: "CA-MB" });
    console.log(test);

    const { country } = req.params;
    let limitResults = 10;
    if (req.query.limitResults && !isNaN(Number(req.query.limitResults))) {
        limitResults = Number(req.query.limitResults);
    }
    if (/^[a-z]+$/i.test(country)) {
        const code = iso3166.country(req.params.country);
        if (!code) {
            return res.status(200).json({
                results: 0,
                data: []
            });
        }

        const airportResponse = await GNS430Airport_Update.aggregate([
            {
                $search: {
                    text: {
                        query: `${code.code}`,
                        path: "station.country"
                    }
                }
            }
        ]).limit(limitResults);

        return res.status(200).json({
            results: airportResponse.length,
            data: airportResponse
        });
    } else {
        return res.status(200).json({
            results: 0,
            data: []
        });
    }
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
                    path: ["ICAO", "station.name", "station.city"]
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
