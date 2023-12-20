require("dotenv").config({ path: "../config.env" });
const axios = require("axios");
const fs = require("fs");
const csv = require("csv-parser");
const zlib = require("zlib");

module.exports.downloadAndUnzip = async (url) => {
    const response = await axios({
        method: "get",
        url: url,
        responseType: "stream"
    });

    const writer = fs.createWriteStream("./utils/AWC_Weather/Data/metars.csv");

    response.data.pipe(zlib.createGunzip()).pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });
};

module.exports.downloadAndProcessAWCData = () => {
    return new Promise((resolve, reject) => {
        const rawDataArray = [];
        const readFile = fs.createReadStream("./utils/AWC_Weather/Data/metars.csv", {
            encoding: "utf8"
        });

        readFile.on("error", (err) => {
            console.log("Error reading stream:", err);
            reject(err);
            readFile.close();
        });

        readFile
            .pipe(
                csv({
                    skipLines: 5
                })
            )
            .on("data", (data) => {
                rawDataArray.push(data);
            })
            .on("end", () => {
                console.log("read file complete");
                const writeStream = fs.createWriteStream("./utils/AWC_Weather/Data/metars.json", {
                    encoding: "utf8"
                });
                writeStream.on("error", (err) => {
                    console.log("error writing stream:", err);
                    reject(err);
                    writeStream.close();
                });
                writeStream.write(JSON.stringify(rawDataArray), () => {
                    console.log("write metar data to JSON complete");
                    resolve();
                });
                writeStream.end();
                writeStream.on("finish", () => {
                    // Handle cleanup and file deletion after writing is complete
                    if (fs.existsSync("./utils/AWC_Weather/Data/metars.csv")) {
                        fs.unlink("./utils/AWC_Weather/Data/metars.csv", (err) => {
                            if (err) {
                                console.log("error delete csv file:", err);
                            } else {
                                console.log("delete csv file");
                            }
                        });
                    }
                });
            });
    });
};
