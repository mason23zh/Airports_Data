const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.env" });

const conn = mongoose.createConnection(`${process.env.DATABASE}`);

module.exports.SecondaryConnection = conn;
