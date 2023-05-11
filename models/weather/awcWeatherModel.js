const mongoose = require("mongoose");

const awcWeatherSchema = new mongoose.Schema({
    raw_text: {
        type: String,
        required: [true, "Raw metar must exist"],
    },
    station_id: {
        type: String,
        required: [true, "Station id must exist"],
    },
    observation_time: {
        type: Date,
    },
    location: {
        type: {
            type: String,
            default: "Point",
            enum: ["Point"],
        },
        coordinates: [Number],
    },
    temp_c: {
        type: Number,
    },
    dewpoint_c: {
        type: Number,
    },
    wind_dir_degrees: {
        type: Number,
    },
    wind_speed_kt: {
        type: Number,
    },
    wind_gust_kt: {
        type: Number,
    },
    visibility_statute_mi: {
        type: Number,
    },
    altim_in_hg: {
        type: Number,
    },
    auto: {
        type: String,
    },
    flight_category: {
        type: String,
    },
    metar_type: {
        type: String,
    },
    elevation_m: {
        type: Number,
    },
    ios_country: {
        type: String,
    },
    ios_region: {
        type: String,
    },
    continent: {
        type: String,
    },
    municipality: {
        type: String,
    },
    name: {
        type: String,
    },
});

module.exports.AwcWeatherMetarSchema = awcWeatherSchema;
module.exports.AwcWeatherMetarModel = mongoose.model("AwcWeatherMetarModel", awcWeatherSchema);
