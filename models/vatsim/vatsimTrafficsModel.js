const mongoose = require("mongoose");
const vatsimTrafficsSchema = new mongoose.Schema(
    {
        cid: {
            type: Number,
            required: [true, "vatsim cid required"]
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

mongoose.plugin((vatsimTrafficsSchema) => {
    vatsimTrafficsSchema.options.toJSON = {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
        }
    };
});

module.exports.VatsimTraffics = mongoose.model("VatsimTraffics", vatsimTrafficsSchema);
