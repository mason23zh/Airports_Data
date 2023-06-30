const mongoose = require("mongoose");

const airportSchema = new mongoose.Schema({
    id: {
        type: String,
        required: [true, "Airport must have id"],
        unique: true
    },
    ident: {
        type: String,
        required: [true, "Airport must have ident"],
        unique: true
    },
    type: {
        type: String
    },
    name: {
        type: String,
        required: [true, "Airport must have name"]
    },
    latitude_deg: {
        type: String,
        required: [true, "Aiport must have latitude degree"]
    },
    longitude_deg: {
        type: String,
        required: [true, "Aiport must have longitude degree"]
    },
    elevation_ft: {
        type: Number
    },
    continent: {
        type: String,
        required: [true, "Airport must have continent location"]
    },
    iso_country: {
        type: String,
        required: [true, "Airport must have iso country code"]
    },
    iso_region: {
        type: String,
        required: [true, "Airport must have iso region code"]
    },
    municipality: {
        type: String
    },
    scheduled_service: {
        type: String
    },
    gps_code: {
        type: String
    },
    iata_code: {
        type: String
    },
    local_code: {
        type: String
    },
    home_link: {
        type: String
    },
    wikipedia_link: {
        type: String
    },
    keywords: {
        type: String
    }
});

module.exports.Airports = mongoose.model("Airports", airportSchema);
// export default Airports;
