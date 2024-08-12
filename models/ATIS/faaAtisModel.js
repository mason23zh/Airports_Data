const mongoose = require("mongoose");
const faaAtisSchema = new mongoose.Schema({
    airport: {
        type: String,
        required: [true, "Airport ICAO required"]
    },
    type: {
        type: String
    },
    code: {
        type: String,
        required: [true, "ATIS Code Required"]
    },
    datis: {
        type: String
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

module.exports.FaaAtis = mongoose.model("FaaAtis", faaAtisSchema);
