require("dotenv").config({ path: "../config.env" });
const util = require("util");
const stream = require("stream");
const axios = require("axios");
const fs = require("fs");
const pipeline = util.promisify(stream.pipeline);
const csv = require("csv-parser");
const gunzip = require("gunzip-file");

module.exports.downloadAndProcessAWCData = async (url) => {
    try {
        const request = await axios.get(url, {
            responseType: "stream"
        });
        await pipeline(
            request.data,
            fs.createWriteStream("./utils/AWC_Weather/Data/metars.cache.csv.gz")
        )
            .then(() => {
                console.log("download awc gzip finished");
                gunzip(
                    "./utils/AWC_Weather/Data/metars.cache.csv.gz",
                    "./utils/AWC_Weather/Data/metars.csv",
                    () => {
                        console.log("unzip gzip done");

                        const rawDataArray = [];
                        const readFile = fs.createReadStream(
                            "./utils/AWC_Weather/Data/metars.csv",
                            {
                                encoding: "utf8"
                            }
                        );

                        readFile.on("error", (err) => {
                            console.log("Error reading stream:", err);
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
                                readFile.close();
                                const writeStream = fs.createWriteStream(
                                    "./utils/AWC_Weather/Data/metar.json",
                                    {
                                        encoding: "utf8"
                                    }
                                );
                                writeStream.on("error", (err) => {
                                    console.log("error writing stream:", err);
                                    writeStream.close();
                                });
                                writeStream.write(JSON.stringify(rawDataArray), () => {
                                    console.log("write metar data to JSON complete");
                                    //delete
                                    fs.unlink(
                                        "./utils/AWC_Weather/Data/metars.cache.csv.gz",
                                        () => {
                                            console.log("delete zip file");
                                        }
                                    );
                                    fs.unlink("./utils/AWC_Weather/Data/metars.csv", () => {
                                        console.log("delete csv file");
                                    });
                                });
                                writeStream.close();
                            });
                    }
                );
            })
            .finally(() => {
                return Promise.resolve(1);
            });
    } catch (e) {
        console.error("error downloading:", e);
        return Promise.reject(-1);
    }
};
