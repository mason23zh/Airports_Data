const mongoose = require("mongoose");
const vatsimHistoryTrafficsSchema = new mongoose.Schema({
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
    lastUpdated: {
        type: Date
    }
});

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
