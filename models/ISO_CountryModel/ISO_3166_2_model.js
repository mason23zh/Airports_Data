const mongoose = require("mongoose");

const iso3166Schema = new mongoose.Schema(
    {
        countryName: {
            type: String
        },
        regionCode: {
            type: String
        },
        regionName: {
            type: String
        },
        regionType: {
            type: String
        },
        countryCode: {
            type: String
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

module.exports.ISO_3166_Data = mongoose.model("iso_3166_data", iso3166Schema);
