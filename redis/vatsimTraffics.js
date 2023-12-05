const { Schema } = require("redis-om");

//class VatsimTraffics extends Entity {}

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
        track_longitude: { type: "string[]", path: "$.track[*].longitude" },
        track_latitude: { type: "string[]", path: "$.track[*].latitude" },
        track_heading: { type: "string[]", path: "$.track[*].heading" },
        track_altitude: { type: "string[]", path: "$.track[*].altitude" },
        track_groundSpeed: { type: "string[]", path: "$.track[*].groundSpeed" },
        track_updateTime: { type: "string[]", path: "$.track[*].updateTime" },
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
            type: "date"
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
    { dataStructure: "JSON" }
);

exports.exampleSchema = new Schema(
    "Account",
    {
        accountNumber: { type: "string" },
        verified: { type: "boolean" },
        approvers: { type: "string[]", path: "$.transactions[*].approver" },
        amounts: { type: "string[]", path: "$.transactions[*].amount" }
    },
    { dataStructure: "JSON" }
);
