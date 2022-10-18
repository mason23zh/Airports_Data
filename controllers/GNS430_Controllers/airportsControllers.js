const axios = require("axios");
const { GNS430Airport } = require("../../models/airports/GNS430_model/gns430AirportsModel");
const BadRequestError = require("../../common/errors/BadRequestError");
const NotFoundError = require("../../common/errors/NotFoundError");
const APIFeatures = require("../../utils/Data_Convert/apiFeatures");
const { Airports } = require("../../models/airports/airportsModel");
const { generateResponseMetar } = require("../../utils/METAR/generateResponseMETAR");
const { generateResponseATIS } = require("../../utils/ATIS/generateResponseATIS");
const { VATSIM_DATA_URL } = require("../../config");

const earthRadiusInNauticalMile = 3443.92;
const earthRadiusInKM = 6378.1;

const getVatsimData = async (ICAO) => {
    const res = await axios.get(VATSIM_DATA_URL);
    const vatsimAtisArray = res.data.atis;
    let vatsimAtis = "";

    for (const atis of vatsimAtisArray) {
        if (atis.callsign.includes(ICAO)) {
            vatsimAtis = atis.text_atis;
            break;
        }
    }
    vatsimAtis = vatsimAtis.length > 0 ? vatsimAtis : "No Vatsim Atis Found";

    return vatsimAtis;
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
    const gns430Runway = gns430Airport.runway;

    //Vatsim Data
    const vatsimATIS = await getVatsimData(req.params.icao.toUpperCase());

    const responseMetar = await generateResponseMetar(req.params.icao.toUpperCase());
    const responseATIS = await generateResponseATIS(req.params.icao);

    const ATIS = {};

    if (!responseATIS.data.includes("NO ATIS found") && !vatsimATIS.includes("No Vatsim Atis Found")) {
        //if both faa atis and vatsim atis exist
        ATIS.faa = responseATIS.data;
        ATIS.vatsim = vatsimATIS;
    } else if (responseATIS.data.includes("NO ATIS found") && !vatsimATIS.includes("No Vatsim Atis Found")) {
        //if faa atis not found, but vatsim atis found.
        ATIS.vatsim = vatsimATIS;
    } else if (responseATIS.data.includes("NO ATIS found") && vatsimATIS.includes("No Vatsim Atis Found")) {
        //if both faa atis and vatsim atis not found
        ATIS.data = `No ATIS found in ${req.params.icao.toUpperCase()}`;
    }

    console.log("responseATIS DATA:", responseATIS.data);
    res.status(200).json({
        status: "success",
        data: {
            airport: gns430Airport,
            runways: gns430Runway,
            ATIS,
            METAR: responseMetar.data,
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
    //const gns430Airport = await GNS430Airport.find({ ICAO: airportICAO_Code });

    const airportFeatures = new APIFeatures(GNS430Airport.find({ ICAO: airportICAO_Code }), req.query).limitFields();

    const gns430Airport = await airportFeatures.query;

    if (!gns430Airport) {
        throw new NotFoundError(`Can Not Found Airport with IATA: ${req.params.iata.toUpperCase()}`);
    }
    const gns430Runway = gns430Airport.runway;

    const responseMetar = await generateResponseMetar(airportICAO_Code);
    const responseATIS = await generateResponseATIS(airportICAO_Code);
    res.status(200).json({
        status: "success",
        data: {
            airport: gns430Airport,
            runways: gns430Runway,
            METAR: responseMetar.data,
            ATIS: responseATIS.data,
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
