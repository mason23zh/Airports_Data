const axios = require("axios");
const { FAA_ATIS_API_BASE_URL } = require("../../config");
const { getRandomUserAgent } = require("../Online_Flight_Data/randomUserAgent");
const tunnel = require("tunnel");
const { FaaAtis } = require("../../models/ATIS/faaAtisModel");

const isUsAirport = (icao) => {
    if (icao.length < 4) return false;
    const usAirports = ["PANC", "TJSJ", "PHNL"];
    return icao.startsWith("K") || usAirports.includes(icao);
};

const getFaaAtis = async (location) => {
    try {
        const icao = location.toUpperCase();
        if (!isUsAirport(icao)) {
            return { data: [] };
        }

        const atisData = await FaaAtis.find({ airport: icao });

        if (atisData && atisData.length > 0) {
            return { data: atisData };
        }

        // Fallback, make request to https://datil.clowd.io
        const response = await axios.get(`${FAA_ATIS_API_BASE_URL}/${icao}`, {
            headers: {
                "User-Agent": getRandomUserAgent()
            },
            proxy: false,
            httpsAgent: tunnel.httpsOverHttp({
                proxy: {
                    host: process.env.Oxylabs_Proxy,
                    port: process.env.Oxylabs_Port,
                    proxyAuth: `customer-${process.env.Oxylabs_UserName}:${process.env.Oxylabs_Password}`
                }
            })
        });

        // If found, insert fallback data to the DB.
        if (response.data && response.data.length > 0) {
            const newAtisEntries = response.data.map((atis) => ({
                airport: atis.airport,
                type: atis.type,
                code: atis.code,
                datis: atis.datis,
                lastUpdated: new Date()
            }));

            await FaaAtis.insertMany(newAtisEntries);

            return { data: newAtisEntries };
        } else {
            return { data: [] };
        }
    } catch (err) {
        return { data: [] };
    }
};

module.exports.getFaaAtis = getFaaAtis;
