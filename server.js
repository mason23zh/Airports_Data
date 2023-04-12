const mongoose = require("mongoose");
const app = require("./app");
const { PORT } = require("./config");
const { AwcWeatherMetarModel } = require("./models/weather/awcWeatherModel");
const { downloadFile } = require("./utils/AWC_Weather/download_weather");
require("dotenv").config({ path: "./config.env" });

// mongoose.connect(`${process.env.DATABASE}`);
//
// const db = mongoose.connection;
// db.once("connected", () => {
//     console.log("DB CONNECTED");
//     // importToDB();
// });
//
async function importToDB() {
    try {
        console.log("start importing...");
        const awcMetars = await downloadFile(
            "https://www.aviationweather.gov/adds/dataserver_current/current/metars.cache.csv"
        );
        console.log(awcMetars.length);
        await AwcWeatherMetarModel.create(awcMetars);
        console.log("Created");
    } catch (e) {
        console.log("error", e);
    }
}

mongoose.connect(`${process.env.DATABASE}`).then(() => {
    console.log("DB connected");
    // importToDB().then(() => {
    //     console.log("finished importing...");
    // });
});

app.listen(PORT, () => {
    console.log(`Express starts on port ${PORT}`);
});
