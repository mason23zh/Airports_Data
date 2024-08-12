const axios = require("axios");
const { FAA_ATIS_API_BASE_URL } = require("../../config");
const { getRandomUserAgent } = require("../Online_Flight_Data/randomUserAgent");
const tunnel = require("tunnel");
const { FaaAtis } = require("../../models/ATIS/faaAtisModel");
const logger = require("../../logger");
module.exports.importFaaAtisToDB = async () => {
    try {
        const response = await axios.get(`${FAA_ATIS_API_BASE_URL}/all`, {
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

        const atisData = response.data;
        const now = new Date();

        // Fetch all current entries from the database
        const existingEntries = await FaaAtis.find({}, "airport type").exec();
        const existingEntriesSet = new Set(
            existingEntries.map((entry) => `${entry.airport}_${entry.type}`)
        );

        const bulkOps = atisData.map((atis) => ({
            updateOne: {
                filter: { airport: atis.airport, type: atis.type },
                update: {
                    airport: atis.airport,
                    type: atis.type,
                    code: atis.code,
                    datis: atis.datis,
                    lastUpdated: now
                },
                upsert: true
            }
        }));

        // Create a set of new entries for comparison
        // Same airport can have 2 ATIS for dep and arr, use icao_type as key
        const newEntriesSet = new Set(atisData.map((atis) => `${atis.airport}_${atis.type}`));

        // Identify entries that are in the existing set but not in the new set
        const entriesToRemove = [...existingEntriesSet].filter(
            (entry) => !newEntriesSet.has(entry)
        );

        // Add remove operations for outdated entries
        const removeOps = entriesToRemove.map((entry) => {
            const [airport, type] = entry.split("_");
            return {
                deleteOne: {
                    filter: { airport, type }
                }
            };
        });

        // Combine update and remove operations
        const allOps = [...bulkOps, ...removeOps];

        if (allOps.length > 0) {
            await FaaAtis.bulkWrite(allOps);
        }
    } catch (e) {
        logger.error("Error importing ATIS data", e);
    }
};
