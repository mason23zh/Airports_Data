const { Schema } = require("redis-om");

exports.vatsimTrafficsSchema = new Schema(
    "VatsimTraffics",
    {
        cid: {
            type: "number"
        },
        name: {
            type: "string"
        },
        callsign: {
            type: "string"
        },
        server: {
            type: "string"
        },
        track_longitude: { type: "number[]", path: "$.track[*].longitude" },
        track_latitude: { type: "number[]", path: "$.track[*].latitude" },
        track_heading: { type: "number[]", path: "$.track[*].heading" },
        track_altitude: { type: "number[]", path: "$.track[*].altitude" },
        track_groundSpeed: { type: "number[]", path: "$.track[*].groundSpeed" },
        track_updateTime: { type: "string[]", path: "$.track[*].updateTime" },
        track_compensation: { type: "number[]", path: "$.track[*].compensation" },
        transponder: {
            type: "string"
        },
        flightRules: {
            type: "string"
        },
        aircraft_full: { type: "string", path: `$.aircraft[*].full` },
        aircraft_faa: { type: "string", path: `$.aircraft[*].faa` },
        aircraft_short: { type: "string", path: `$.aircraft[*].short` },
        departure: {
            type: "string"
        },
        arrival: {
            type: "string"
        },
        alternate: {
            type: "string"
        },
        depTime: {
            type: "string"
        },
        enrouteTime: {
            type: "string"
        },
        fuelTime: {
            type: "string"
        },
        remarks: {
            type: "string"
        },
        route: {
            type: "string"
        },
        logonTime: {
            type: "string"
        },
        lastUpdated: {
            type: "date"
        }
    },
    {
        dataStructure: "JSON"
    }
);
