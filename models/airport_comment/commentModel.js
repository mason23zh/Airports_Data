const mongoose = require("mongoose");

const airportCommentSchema = new mongoose.Schema(
    {
        comment: {
            type: String,
            required: [true, "Comment cannot be empty"],
            maxLength: [500, "Max length of comment is 500 characters"]
        },
        landingRate: {
            type: Number
        },
        route: {
            type: String
        },
        originAirport: {
            type: mongoose.Schema.ObjectId,
            ref: "GNS430AirportTestModel"
        },
        destinationAirport: {
            type: mongoose.Schema.ObjectId,
            ref: "GNS430AirportTestModel"
        },
        createdAt: {
            type: Date,
            default: Date.now()
        },
        airport: {
            type: mongoose.Schema.ObjectId,
            ref: "GNS430AirportTestModel",
            required: [true, "Comment must belong to an airport"]
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: [true, "Comment must belong to a user"]
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

const Comment = mongoose.model("Comment", airportCommentSchema);

module.exports = Comment;
