const mongoose = require("mongoose");
const app = require("./app");
const { AwcWeatherMetarSchema } = require("./models/weather/awcWeatherModel");
const { downloadAndProcessAWCMetars } = require("./utils/AWC_Weather/download_weather");
require("dotenv").config({ path: "./config.env" });
const schedule = require("node-schedule");
const { normalizeData } = require("./utils/AWC_Weather/normalize_data");
const { SecondaryConnection } = require("./secondaryDbConnection");
const { redisNodeClient } = require("./redis/client");
const { awcMetarRepository } = require("./redis/awcMetar");

async function importMetarsToDB(Latest_AwcWeatherModel) {
    try {
        console.log("start downloading data from AWC...");
        const awcMetars = await downloadAndProcessAWCMetars(
            "https://www.aviationweather.gov/adds/dataserver_current/current/metars.cache.csv"
        );
        if (awcMetars.length && awcMetars.length > 0) {
            console.log("Download Finished, data length:", awcMetars.length);

            // Delete old data.
            console.log("Deleting old data...");
            await Latest_AwcWeatherModel.deleteMany({});
            console.log("Old data deleted");

            //clear redis cache
            const redisNode = await redisNodeClient();
            redisNode.flushAll("ASYNC", () => {
                console.log("Redis cache flushed");
            });

            console.log("Starting normalizing awc metars...");
            const normalizedMetar = await normalizeData();

            console.log("store normalized metar into redis");
            const client = await awcMetarRepository();
            // await client.dropIndex();
            await client.createIndex();

            await Promise.all(
                JSON.parse(normalizedMetar).map(async (metar) => {
                    let updatedMetar = {
                        ...metar,
                        temp_c: Number(metar.temp_c),
                        dewpoint_c: Number(metar.dewpoint_c),
                        wind_dir_degrees: Number(metar.wind_dir_degrees),
                        wind_speed_kt: Number(metar.wind_speed_kt),
                        wind_gust_kt: Number(metar.wind_gust_kt),
                        visibility_statute_mi: Number(metar.visibility_statute_mi),
                        altim_in_hg: Number(metar.altim_in_hg),
                        elevation_m: Number(metar.elevation_m),
                        auto: metar.auto || "FALSE",
                    };
                    await client.createAndSave(updatedMetar);
                })
            );

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
    (async () => {
        const client = await awcMetarRepository();
        await client.createIndex();
    })();
    schedule.scheduleJob("*/10 * * * *", async () => {
        await importMetarsToDB(Latest_AwcWeatherModel);
    });
});
const port = process.env.PORT || 80;
app.listen(port, () => {
    console.log(`Express starts on port ${port}`);
});
