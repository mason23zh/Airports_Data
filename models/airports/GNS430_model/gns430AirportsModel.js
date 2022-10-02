const mongoose = require("mongoose");

const gns430AirportSchema = new mongoose.Schema({
    ICAO: {
        type: String,
        required: [true, "Airport Must have ICAO"],
    },
    name: {
        type: String,
    },
    coordinates: {
        type: [Number], //longitude,latitude
    },
    elevation: {
        type: Number,
    },
    transitionAltitude: {
        type: Number,
    },
    runways: [
        {
            runway_id: {
                type: String,
            },
            runwayHdg: {
                type: Number,
            },
            runwayWidth: {
                type: Number,
            },
            runwayLength: {
                type: Number,
            },
            runway_ils_avl: {
                type: Number,
            },
            ilsFreq: {
                type: Number,
            },
            ilsHdg: {
                type: Number,
            },
            coordinates: {
                type: [Number], //longitude,latitude
            },
            thresholdElevation: {
                type: Number,
            },
            thresholdOverflyAlt: {
                type: Number,
            },
            gsAngle: {
                type: Number,
            },
            surfaceType: {
                type: Number,
                enum: [0, 1, 2, 3], //0)concrete 1)Asphal/bitumen/blacktop 2)grabel/coral/ice/snow 3)other
            },
            runwayStatus: {
                type: Number,
                enum: [0, 1, 2, 3], //0)takeoff/land 1)takeoff only 2)land only 3)closed
            },
        },
    ],
});

module.exports.GNS430Airport = mongoose.model("GNS430Airport", gns430AirportSchema);