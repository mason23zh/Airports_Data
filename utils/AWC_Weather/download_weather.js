require("dotenv").config({ path: "../config.env" });
const mongoose = require("mongoose");
const util = require("util");
const stream = require("stream");
const axios = require("axios");
const fs = require("fs");
const CSVToJson = require("../Data_Convert/csvToJson");
const pipeline = util.promisify(stream.pipeline);
const awc_csv_metar = "./dev-data/csv_data/awc_metars.csv";
const awc_csv_modified_metar = "./dev-data/weather/awc_metars.csv";
const awc_json_metar = "./dev-data/json_data/awc_metars.json";
const { AwcWeather } = require("../../models/weather/awcWeatherModel");
// const ImportData = require("../../models/importDataToDB");

// download csv
// remove top lines from csv
// convert csv to json
// import new csv to AWC model

// const importData = async (data) => {
//     try {
//         mongoose.connect(`${process.env.DATABASE}`).then(() => {
//             console.log("DB connected for import data");
//         });
//         console.log(data.length);
//         await AwcWeather.create(data);
//         console.log("data imported");
//     } catch (e) {
//         console.log(e);
//     }
// };

module.exports.downloadFile = async (url) => {
    let awcWeatherStatus = {
        error: "",
        warning: "",
        sources: "",
        time: "",
        results: "",
    };

    const request = await axios.get(url, {
        responseType: "stream",
    });
    await pipeline(request.data, fs.createWriteStream("./dev-data/csv_data/awc_metars.csv"));
    let csvContent = fs.readFileSync(awc_csv_metar).toString().split("\n");
    awcWeatherStatus.error = csvContent[0];
    awcWeatherStatus.warning = csvContent[1];
    awcWeatherStatus.time = csvContent[2];
    awcWeatherStatus.sources = csvContent[3];
    awcWeatherStatus.results = csvContent[4];

    csvContent.splice(0, 5);
    csvContent = csvContent.join("\n");

    fs.writeFileSync("./dev-data/weather/awc_metars.csv", csvContent);

    const awc_metars = new CSVToJson(awc_csv_modified_metar, awc_json_metar);
    await awc_metars.csvToJson();

    const awcMetars = JSON.parse(fs.readFileSync(awc_json_metar, "utf-8"));

    return awcWeatherStatus;
};
