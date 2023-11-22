const mongoose = require("mongoose");
const vatsimEventsSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: [true, "vatsim event id required"]
    },
    type: {
        type: String
    },
    name: {
        type: String,
        required: [true, "vatsim event name required"]
    },
    link: {
        type: String
    },
    organisers: [
        {
            region: {
                type: String
            },
            division: {
                type: String
            },
            subdivision: {
                type: String
            },
            organised_by_vatsim: {
                type: Boolean
            }
        }
    ],
    airports: [
        {
            icao: {
                type: String
            }
        }
    ],
    start_time: {
        type: Date
    },
    end_time: {
        type: Date
    },
    short_description: {
        type: String
    },
    description: {
        type: String
    },
    banner: {
        type: String
    }
});

module.exports.VatsimEvents = mongoose.model("VatsimEvents", vatsimEventsSchema);
