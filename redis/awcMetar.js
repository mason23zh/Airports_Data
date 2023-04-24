const { Entity, Schema } = require("redis-om");
const { redisClient } = require("./client");

class AwcMetar extends Entity {}

const awcMetarSchema = new Schema(AwcMetar, {
    raw_text: {
        type: "string",
    },
    station_id: {
        type: "string",
    },
    observation_time: {
        type: "date",
    },
    latitude: {
        type: "string",
    },
    longitude: {
        type: "string",
    },
    temp_c: {
        type: "number",
        sortable: true,
    },
    dewpoint_c: {
        type: "number",
        sortable: true,
    },
    wind_dir_degrees: {
        type: "number",
    },
    wind_speed_kt: {
        type: "number",
        sortable: true,
    },
    wind_gust_kt: {
        type: "number",
        sortable: true,
    },
    visibility_statute_mi: {
        type: "number",
        sortable: true,
    },
    altim_in_hg: {
        type: "number",
        sortable: true,
    },
    auto: {
        type: "string",
    },
    flight_category: {
        type: "string",
    },
    metar_type: {
        type: "string",
    },
    elevation_m: {
        type: "number",
        sortable: true,
    },
    ios_country: {
        type: "string",
    },
    ios_region: {
        type: "string",
    },
    continent: {
        type: "string",
    },
    municipality: {
        type: "string",
    },
    name: {
        type: "string",
    },
});

module.exports.awcMetarRepository = async () => {
    return (await redisClient()).fetchRepository(awcMetarSchema);
};