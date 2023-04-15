const mongoose = require("mongoose");
const app = require("./app");
const { PORT } = require("./config");
const { AwcWeatherMetarSchema } = require("./models/weather/awcWeatherModel");
const { downloadFile } = require("./utils/AWC_Weather/download_weather");
require("dotenv").config({ path: "./config.env" });
const schedule = require("node-schedule");
const { normalizeData } = require("./utils/AWC_Weather/normalize_data");
const { SecondaryConnection } = require("./secondaryDbConnection");

async function importMetarsToDB(Latest_AwcWeatherModel) {
    try {
        // create new mongoose connection
        // console.log("Starting DB...");
        // const conn = mongoose.createConnection(`${process.env.DATABASE}`);
        // create new model based on the AwcWeather Schema
        // console.log("DB connected");
        // const Latest_AwcWeatherModel = conn.model("AwcWeatherMetarModel_Latest", AwcWeatherMetarSchema);
        // downloading latest AWC metar CSV file
        console.log("start downloading data from AWC...");
        const awcMetars = await downloadFile(
            "https://www.aviationweather.gov/adds/dataserver_current/current/metars.cache.csv"
        );
        if (awcMetars.length && awcMetars.length > 0) {
            console.log("Download Finished, data length:", awcMetars.length);

            // Delete old data.
            console.log("Deleting old data...");
            await Latest_AwcWeatherModel.deleteMany({});
            console.log("Old data deleted");
            console.log("Starting normalizing awc metars...");
            const normalizedMetar = await normalizeData();

            // import new metar into the latest AWC Model
            console.log("Start importing data to Database...");
            const docs = await Latest_AwcWeatherModel.create(JSON.parse(normalizedMetar));
            console.log("Data imported, total entries:", docs.length);

            console.log("Copy all data to AwcWeatherMetarModel...");
            await Latest_AwcWeatherModel.aggregate([{ $out: "awcweathermetarmodels" }]);
            console.log("Data merged successfully, Let's rock!");
            // console.log("Close DB connection...");
            // conn.disconnect();
            // console.log("DB Closed");
            return normalizedMetar;
        } else {
            console.log("AWC Metar download failed...");
            return;
        }
    } catch (e) {
        console.log("error import data", e);
    }
}

const Latest_AwcWeatherModel = SecondaryConnection.model("AwcWeatherMetarModel_Latest", AwcWeatherMetarSchema);
mongoose.connect(`${process.env.DATABASE}`).then(() => {
    console.log("DB connected");
    schedule.scheduleJob("*/10 * * * *", async () => {
        await importMetarsToDB(Latest_AwcWeatherModel);
    });
});

app.listen(PORT, () => {
    console.log(`Express starts on port ${PORT}`);
});
