const mongoose = require("mongoose");
const vatsimHistoryTrafficsSchema = new mongoose.Schema(
    {
        cid: {
            type: Number
        },
        name: {
            type: String
        },
        callsign: {
            type: String
        },
        server: {
            type: String
        },
        track: [
            {
                _id: false,
                latitude: {
                    type: Number
                },
                longitude: {
                    type: Number
                },
                altitude: {
                    type: Number
                },
                groundSpeed: {
                    type: Number
                },
                heading: {
                    type: Number
                },
                qnhIhg: {
                    type: Number
                }
            }
        ],
        transponder: {
            type: String
        },
        flightRules: {
            type: String
        },
        aircraft: {
            full: {
                type: String
            },
            faa: {
                type: String
            },
            short: {
                type: String
            }
        },
        departure: {
            type: String
        },
        arrival: {
            type: String
        },
        alternate: {
            type: String
        },
        depTime: {
            type: String
        },
        enrouteTime: {
            type: String
        },
        fuelTime: {
            type: String
        },
        remarks: {
            type: String
        },
        route: {
            type: String
        },
        logonTime: {
            type: Date
        },
        lastUpdated: {
            type: Date
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

mongoose.plugin((vatsimHistoryTrafficsSchema) => {
    vatsimHistoryTrafficsSchema.options.toJSON = {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
        }
    };
});

module.exports.VatsimHistoryTraffics = mongoose.model(
    "VatsimHistoryTraffics",
    vatsimHistoryTrafficsSchema
);
