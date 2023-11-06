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

const processCSV = async () => {
    let awcWeatherStatus = {
        error: "",
        warning: "",
        sources: "",
        time: "",
        results: ""
    };
    // let csvContent = fs.readFile(awc_csv_metar, (err, data) => {
    //     console.log(data);
    // });

    let csvContent = fs.readFileSync(awc_csv_metar);
    csvContent = csvContent.toString().split("\n");
    if (csvContent.length > 1) {
        awcWeatherStatus.error = csvContent[0];
        awcWeatherStatus.warning = csvContent[1];
        awcWeatherStatus.time = csvContent[2];
        awcWeatherStatus.sources = csvContent[3];
        awcWeatherStatus.results = csvContent[4];

        csvContent.splice(0, 5);
        csvContent = csvContent.join("\n");
        // console.log("CSV content:", csvContent);
        fs.writeFileSync("./utils/AWC_Weather/Data/awc_metars.csv", csvContent);

        const awc_metars = new CSVToJson(awc_csv_modified_metar, awc_json_metar);
        await awc_metars.csvToJson();
    }
    return JSON.parse(fs.readFileSync(awc_json_metar));
};

const downloadFile = async (url) => {
    try {
        const request = await axios.get(url, {
            responseType: "stream"
        });
        await pipeline(
            request.data,
            fs.createWriteStream("./utils/AWC_Weather/Data/awcMetarZip.gz")
        );
        console.log("download AWC Zip file pipeline successful");
        return new Promise((resolve) => {
            resolve();
        });
    } catch (error) {
        console.error("download AWC Zip file pipeline failed", error);
        return new Promise((res, rej) => {
            rej(error);
        });
    }
};

const unzipFile = async () => {
    //unzip
    const zipFile = fs.readFileSync("./utils/AWC_Weather/Data/awcMetarZip.gz");
    const unzippedFile = zlib.unzipSync(zipFile);
    fs.writeFileSync("./utils/AWC_Weather/Data/raw_awc_metars.csv", unzippedFile);
};

module.exports.downloadAndProcessAWCMetars = async (url) => {
    // let awcWeatherStatus = {
    //     error: "",
    //     warning: "",
    //     sources: "",
    //     time: "",
    //     results: ""
    // };
    // const readZip = fs.createReadStream("./utils/AWC_Weather/Data/awcMetarZip.gz");
    // const writeUnzip = fs.createWriteStream(awc_csv_metar);
    downloadFile(url)
        .then(() => {
            unzipFile().then(() => {
                processCSV();
            });
        })
        .catch();

    // return result;
    // await downloadFile(url).catch();
    // await unzipFile(readZip, writeUnzip);
    //
    // if (fs.readFileSync(awc_csv_metar)) {
    //     const content = await processCSV();
    //     return content;
    // } else {
    //     return [];
    // }
};
