require("dotenv").config({ path: "../config.env" });
const util = require("util");
const stream = require("stream");
const axios = require("axios");
const fs = require("fs");
const zlib = require("zlib");
const CSVToJson = require("../Data_Convert/csvToJson");
const pipeline = util.promisify(stream.pipeline);
const awc_csv_metar = "./utils/AWC_Weather/Data/raw_awc_metars.csv";
const awc_csv_modified_metar = "./utils/AWC_Weather/Data/awc_metars.csv";
const awc_json_metar = "./utils/AWC_Weather/Data/awc_metars.json";

module.exports.downloadAndProcessAWCMetars = async (url) => {
    let awcWeatherStatus = {
        error: "",
        warning: "",
        sources: "",
        time: "",
        results: ""
    };

    const request = await axios.get(url, {
        responseType: "stream"
    });
    // await pipeline(
    //     request.data,
    //     fs.createWriteStream("./utils/AWC_Weather/Data/raw_awc_metars.csv")
    // );
    await pipeline(request.data, fs.createWriteStream("./utils/AWC_Weather/Data/awcMetarZip.gz"));
    //unzip
    const readZip = fs.createReadStream("./utils/AWC_Weather/Data/awcMetarZip.gz");
    const writeUnzip = fs.createWriteStream("./utils/AWC_Weather/Data/awc_metars.csv");
    const unzip = zlib.createGunzip();
    readZip.pipe(unzip).pipe(writeUnzip);

    let csvContent = fs.readFileSync(awc_csv_metar).toString().split("\n");
    awcWeatherStatus.error = csvContent[0];
    awcWeatherStatus.warning = csvContent[1];
    awcWeatherStatus.time = csvContent[2];
    awcWeatherStatus.sources = csvContent[3];
    awcWeatherStatus.results = csvContent[4];

    csvContent.splice(0, 5);
    csvContent = csvContent.join("\n");

    fs.writeFileSync("./utils/AWC_Weather/Data/awc_metars.csv", csvContent);

    const awc_metars = new CSVToJson(awc_csv_modified_metar, awc_json_metar);
    await awc_metars.csvToJson();

    return JSON.parse(fs.readFileSync(awc_json_metar, "utf-8"));
};
