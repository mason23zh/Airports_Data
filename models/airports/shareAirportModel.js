const mongoose = require("mongoose");

const shareAirportSchema = new mongoose.Schema({
    user: {
        type: String
    },
    url: {
        type: String
    },
    airport: {
        type: String
    }
});

module.exports.ShareAirport = mongoose.model("ShareAirport", shareAirportSchema);
