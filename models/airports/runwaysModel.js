const mongoose = require("mongoose");

const runwaySchema = new mongoose.Schema({
    id: {
        type: String,
        required: [true, "Runway needs ID"]
    },
    airport_ref: {
        type: String,
        required: [true, "Runway need airport id"]
    },
    airport_ident: {
        type: String,
        required: [true, "Runway need airport ident"]
    },
    length_ft: {
        type: Number
    },
    width_ft: {
        type: Number
    },
    surface: {
        type: String
    },
    lighted: {
        type: String
    },
    closed: {
        type: String
    },
    le_ident: {
        type: String
    },
    le_latitude_deg: {
        type: String
    },
    le_longitude_deg: {
        type: String
    },
    le_elevation_ft: {
        type: Number
    },
    le_heading_degT: {
        type: Number
    },
    le_displaced_threshold_ft: {
        type: Number
    },
    he_ident: {
        type: String
    },
    he_latitude_deg: {
        type: String
    },
    he_longitude_deg: {
        type: String
    },
    he_elevation_ft: {
        type: Number
    },
    he_heading_degT: {
        type: String
    },
    he_displaced_threshold_ft: {
        type: Number
    }
});

module.exports.Runways = mongoose.model("Runways", runwaySchema);
