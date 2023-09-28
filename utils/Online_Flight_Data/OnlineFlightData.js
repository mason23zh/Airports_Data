// const axios = require("axios");
require("dotenv").config({ path: "../../../config.env" });
const cheerio = require("cheerio");
const { getRandomUserAgent } = require("./randomUserAgent");
const tunnel = require("tunnel");
const axios = require("axios-https-proxy-fix");
axios.defaults.timeout = 15000;

class OnlineFlightData {
    constructor(ICAO) {
        this.ICAO = ICAO;
        this.flightAwareUrl = `https://www.flightaware.com/live/airport/${this.ICAO}`;
        this.indexToBeRemoved = [0, 1, 22, 23];
        this.originalHTML = null;
        this.arrivalPlainData = [];
        this.departurePlainData = [];
        this.formattedArrivalData = [];
        this.formattedDepartureData = [];
    }

    async getHTML() {
        // await axios(this.flightAwareUrl, {
        //     headers: {
        //         "User-Agent": getRandomUserAgent()
        //     },
        //     proxy: {
        //         host: process.env.Oxylabs_Proxy,
        //         port: process.env.Oxylabs_Port,
        //         auth: {
        //             username: `customer-${process.env.Oxylabs_UserName}`,
        //             password: process.env.Oxylabs_Password
        //         }
        //     }
        // })

        await axios(this.flightAwareUrl, {
            headers: {
                "User-Agent": getRandomUserAgent()
            },
            proxy: false,
            httpsAgent: tunnel.httpsOverHttp({
                proxy: {
                    host: process.env.Oxylabs_Proxy,
                    port: process.env.Oxylabs_Port,
                    proxyAuth: `customer-${process.env.Oxylabs_UserName}:${process.env.Oxylabs_Password}`
                }
            })
        })
            .then((response) => {
                if (response && response.status === 200) {
                    this.originalHTML = response.data;
                    this.extractDepartureData();
                    this.extractArrivalData();
                    this.formatDepartureData();
                    this.formatArrivalData();
                }
            })
            .catch((error) => {
                console.log(error);
            });
    }

    getKeyByValue(object, value) {
        return Object.keys(object).find((key) => object[key] === value);
    }

    formatPlainData(planData, departure) {
        let formattedData = [];
        if (planData) {
            formattedData = planData.map((airport) => {
                const ident = this.getKeyByValue(airport, 0);
                const aircraftType = this.getKeyByValue(airport, 1);
                const origin = this.getKeyByValue(airport, 2);
                const departureTime = this.getKeyByValue(airport, 3);
                const arrivalTime = this.getKeyByValue(airport, 5);
                if (!departure) {
                    return {
                        ident,
                        aircraftType,
                        origin,
                        departureTime,
                        arrivalTime
                    };
                } else {
                    return {
                        ident,
                        aircraftType,
                        destination: origin,
                        departureTime,
                        arrivalTime
                    };
                }
            });
            return formattedData;
        } else {
            return formattedData;
        }
    }

    extractDepartureData() {
        const $ = cheerio.load(this.originalHTML);

        const tableData = [];
        $("#departures-board, #scheduled-board")
            .find("table")
            .find("tr")
            .each((i, row) => {
                const rowData = {};
                $(row)
                    .find("td, th")
                    .each((j, cell) => {
                        rowData[$(cell).text()] = j;
                    });
                tableData.push(rowData);
            });

        if (tableData.length > 0) {
            const indexSet = new Set(this.indexToBeRemoved);
            this.departurePlainData = tableData.filter((value, i) => !indexSet.has(i));
        }
    }

    extractArrivalData() {
        const $ = cheerio.load(this.originalHTML);

        const tableData = [];
        $("#arrivals-board, #enroute-board")
            .find("table")
            .find("tr")
            .each((i, row) => {
                const rowData = {};
                $(row)
                    .find("td, th")
                    .each((j, cell) => {
                        rowData[$(cell).text()] = j;
                    });
                tableData.push(rowData);
            });
        if (tableData.length > 0) {
            const indexSet = new Set(this.indexToBeRemoved);
            this.arrivalPlainData = tableData.filter((value, i) => !indexSet.has(i));
        }
    }

    formatArrivalData() {
        if (this.arrivalPlainData) {
            this.formattedArrivalData = this.formatPlainData(this.arrivalPlainData, false);
        }
    }

    formatDepartureData() {
        if (this.departurePlainData) {
            this.formattedDepartureData = this.formatPlainData(this.departurePlainData, true);
        }
    }

    getArrivalsData() {
        if (this.formattedArrivalData) {
            return this.formattedArrivalData;
        }
    }

    getDeparturesData() {
        return this.formattedDepartureData;
    }
}

module.exports = OnlineFlightData;
