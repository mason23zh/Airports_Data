const fs = require("fs");
const mongoose = require("mongoose");
const { Airports } = require("../../models/airports/airportsModel");

require("dotenv").config({ path: "../../config.env" });

mongoose.connect(`${process.env.DATABASE}`).then(() => {
    console.log("DB connected");
});

const readAirportsFromDB = async (type, continent) => {
    const airports = await Airports.find({ type: `${type}`, continent: `${continent}` });

    console.log(`Found ${airports.length} airports in ${continent}`);
    const fileName = `${type}In${continent}.json`;

    fs.writeFileSync(fileName, JSON.stringify(airports));
};
readAirportsFromDB("large_airport", "NA");
