const { GNS430Airport } = require("../../models/airports/GNS430_model/gns430AirportsModel");
const BadRequestError = require("../../common/errors/BadRequestError");
const NotFoundError = require("../../common/errors/NotFoundError");
const APIFeatures = require("../../utils/Data_Convert/apiFeatures");
const { Airports } = require("../../models/airports/airportsModel");
const { generateGeneralATIS } = require("../../utils/ATIS/generateFaaAndVatsimATIS");
const { checkICAO } = require("../../utils/checkICAO");
const { getAwcMetarUsingICAO } = require("../Weather/weatherControllers");

const earthRadiusInNauticalMile = 3443.92;
const earthRadiusInKM = 6378.1;

module.exports.getAirportByICAO_GNS430_Basic = async (req, res, next) => {
    const airportFeatures = new APIFeatures(
        GNS430Airport.findOne({ ICAO: `${req.params.icao.toUpperCase()}` }),
        req.query
    ).limitFields();

    const gns430Airport = await airportFeatures.query;

    if (!gns430Airport) {
        throw new BadRequestError(`Airport with ICAO ${req.params.icao.toUpperCase()} not found. `);
    }

    res.status(200).json({
        status: "success",
        data: {
            airport: gns430Airport,
        },
    });
};

module.exports.getAirportByICAO_GNS430 = async (req, res, next) => {
    const airportFeatures = new APIFeatures(
        GNS430Airport.findOne({ ICAO: `${req.params.icao.toUpperCase()}` }),
        req.query
    ).limitFields();

    airportFeatures.query = airportFeatures.query.populate({ path: "comments" });
    const gns430Airport = await airportFeatures.query;

    if (!gns430Airport) {
        throw new BadRequestError(`Airport with ICAO ${req.params.icao.toUpperCase()} not found. `);
    }

    const responseMetar = await getAwcMetarUsingICAO(req.params.icao.toUpperCase());
    const ATIS = await generateGeneralATIS(req.params.icao.toUpperCase());

    res.status(200).json({
        status: "success",
        data: {
            airport: gns430Airport,
            ATIS,
            METAR: responseMetar,
        },
    });
};

module.exports.getAirportByIATA_GNS430 = async (req, res, next) => {
    const airportICAO = await Airports.find({
        iata_code: `${req.params.iata.toUpperCase()}`,
    });

    if (airportICAO.length === 0) {
        throw new BadRequestError(
            `Airport with IATA: '${req.params.iata.toUpperCase()}' Not Found ${
                req.params.iata.length > 3 ? "(IATA code length is 3)" : ""
            }`
        );
    }

    const airportICAO_Code = airportICAO[0].ident;

    const airportFeatures = new APIFeatures(GNS430Airport.find({ ICAO: airportICAO_Code }), req.query).limitFields();

    const gns430Airport = await airportFeatures.query;

    const ATIS = await generateGeneralATIS(airportICAO_Code);
    if (!gns430Airport) {
        throw new NotFoundError(`Can Not Found Airport with IATA: ${req.params.iata.toUpperCase()}`);
    }

    const responseMetar = await getAwcMetarUsingICAO(airportICAO_Code);
    res.status(200).json({
        status: "success",
        data: {
            airport: gns430Airport,
            METAR: responseMetar,
            ATIS,
        },
    });
};

module.exports.getAirportByName_GNS430 = async (req, res) => {
    const airportQueryObj = GNS430Airport.find({
        name: { $regex: `${req.params.name}`, $options: "i" },
    });

    const featuresQuery = new APIFeatures(airportQueryObj, req.query).filter().limitFields().limitResults().paginate();

    const airports = await featuresQuery.query;

    res.status(200).json({
        status: "success",
        results: airports.length,
        data: {
            airport: airports,
        },
    });
};

module.exports.getAirportsByCity_GNS430 = async (req, res) => {
    const airportsQueryObj = Airports.find({
        municipality: { $regex: `${req.params.name}`, $options: "i" },
    });

    const featuresQuery = new APIFeatures(airportsQueryObj, req.query).filter().limitFields().limitResults().paginate();

    const airports = await featuresQuery.query;

    const filteredAirports = [];
    await Promise.all(
        airports.map(async (airport) => {
            const filteredAirport = await GNS430Airport.find({ ICAO: airport.ident });
            if (filteredAirport.length !== 0) {
                filteredAirports.push(filteredAirport[0]);
            }
        })
    );

    res.status(200).json({
        status: "success",
        results: filteredAirports.length,
        data: {
            airport: filteredAirports,
        },
    });
};

module.exports.getAirportByGenericInput_GNS430 = async (req, res) => {
    // If checkICAO return true, check ICAO first
    const userInput = req.params.data;
    let airports = [];
    let filteredAirports = [];
    let responseAirports = [];

    if (checkICAO(userInput)) {
        const airportsWithICAO = await GNS430Airport.findOne({
            ICAO: `${userInput.toUpperCase}`,
        });
        airports = [...airportsWithICAO];
    } else {
        const airportsWithGNS430 = await GNS430Airport.find({
            $or: [{ ICAO: `${userInput.toUpperCase()}` }, { name: { $regex: `${userInput}`, $options: "i" } }],
        });

        const airportWithCity = await Airports.find({
            municipality: { $regex: `${userInput}`, $options: "i" },
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
    }

    res.status(200).json({
        status: "success",
        result: responseAirports.length,
        data: responseAirports,
    });
};

module.exports.getAirportWithin = async (req, res) => {
    const { icao, distance, unit } = req.params;
    const originAirport = await GNS430Airport.findOne({ ICAO: `${icao.toUpperCase()}` });

    if (originAirport === null) {
        throw new NotFoundError(`Airport with ICAO: ${icao.toUpperCase()} not found`);
    }

    const [lng, lat] = originAirport.location.coordinates;
    const radius = unit === "km" ? distance / earthRadiusInKM : distance / earthRadiusInNauticalMile;

    const targetAirports = await GNS430Airport.find({
        location: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radius],
            },
        },
    });

    res.status(200).json({
        status: "success",
        results: targetAirports.length,
        data: {
            airport: targetAirports,
        },
    });
};

const deg2rad = (deg) => deg * (Math.PI / 180);

const getDistanceFromLatLonInKm = (originLng, originLat, desLng, desLat) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(originLat - desLat); // deg2rad below
    const dLon = deg2rad(originLng - desLng);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(originLat)) * Math.cos(deg2rad(desLat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
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

    const destinationAirport = await GNS430Airport.findOne({ ICAO: `${destinationICAO.toUpperCase()}` });
    if (destinationAirport === null) {
        throw new NotFoundError(`Airport with ICAO: ${destinationICAO.toUpperCase()} not found.`);
    }

    const [originLng, originLat] = originAirport.location.coordinates;
    const [destinationLng, destinationLat] = destinationAirport.location.coordinates;

    const calculatedDistance = getDistanceFromLatLonInKm(originLng, originLat, destinationLng, destinationLat);
    const distance = unit === "km" ? calculatedDistance : calculatedDistance * 0.539957;

    res.status(200).json({
        status: "success",
        data: {
            distance: distance.toFixed(1),
        },
    });
};
