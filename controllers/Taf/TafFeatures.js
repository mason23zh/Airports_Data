const axios = require("axios");
const { metarWeatherCode, metarCloudCode, tafForecastType } = require("../METAR/constants");
const { globalICAO } = require("../../utils/AWC_Weather/airportsICAO");

class TafFeatures {
    constructor(icaoArray) {
        this.icaoArray = icaoArray;
        this.rawXMLTaf = "";
        this.parsedWholeTaf = undefined;
        this.parsedForecast = [];
        this.weather = [];
    }

    async requestTafNew() {
        const url = this.#generateRequestURL();
        if (!url) {
            this.parsedWholeTaf = null;
            return;
        }
        try {
            const response = await axios.get(url);
            if (response && response.data) {
                this.parsedWholeTaf = response.data;
                return Promise.resolve(this);
            } else {
                return Promise.reject(null);
            }
        } catch (e) {
            return Promise.reject(null);
        }
    }

    #generateRequestURL() {
        const icaoString = this.icaoArray
            .filter((icao) => {
                if (globalICAO.includes(icao.toUpperCase())) {
                    return icao;
                }
            })
            .toString()
            .toUpperCase()
            .trim();
        if (!icaoString) {
            return null;
        }

        return `https://aviationweather.gov/cgi-bin/data/taf.php?ids=${icaoString}&sep=true&format=json`;
    }

    #decodeWeatherCode(code) {
        let weatherText = "";
        // check for special weather code
        if (code.length >= 4 && metarWeatherCode[code]) {
            weatherText = `${weatherText} ${metarWeatherCode[code]}`;
            return weatherText;
        }

        for (let i = 0; i < code.length - 1; i += 2) {
            const singleCode = code.slice(i, i + 2);
            if (metarWeatherCode[singleCode]) {
                weatherText = `${weatherText} ${metarWeatherCode[singleCode]}`;
            } else {
                return;
            }
        }

        return weatherText;
    }

    #generateWeather(wxCodes) {
        this.weather = [];
        for (let i = 0; i < wxCodes.length; i++) {
            let intensityFlag;
            // check if weather code has intensity flag;
            if (wxCodes[i].includes("+") || wxCodes[i].includes("-")) {
                intensityFlag = wxCodes[i].slice(0, 1);
                const tempWeatherCode = wxCodes[i].slice(1);
                const tempWeatherText = this.#decodeWeatherCode(tempWeatherCode);
                if (tempWeatherText && tempWeatherText.length !== 0) {
                    let text = intensityFlag
                        ? `${metarWeatherCode[intensityFlag]}${tempWeatherText}`
                        : "";
                    this.weather.push({ code: wxCodes[i], text: text });
                }
            } else {
                let text = this.#decodeWeatherCode(wxCodes[i]);
                if (text && text.length !== 0) {
                    this.weather.push({ code: wxCodes[i], text: text });
                }
            }
        }
        return this;
    }

    /**
     * Return the raw TAF
     */
    getRawTaf() {
        if (this.parsedWholeTaf) {
            const rawRaf = this.parsedWholeTaf.map((taf) => taf.rawTAF);
            return rawRaf;
        } else {
            return [];
        }
    }

    /**
     * Decode and return the forecast section of TAF
     */
    getDecodeTaf() {
        if (this.parsedWholeTaf) {
            this.parsedWholeTaf.map((taf) => {
                let tempParsedTaf = {
                    icao: taf?.icaoId,
                    raw_text: taf?.rawTAF,
                    remarks: taf?.remarks,
                    forecast: []
                };
                if (taf.fcsts) {
                    taf.fcsts.map((f) => {
                        let tempForecastObj = { from: "", to: "", wind: {}, skyCondition: [] };
                        tempForecastObj.from = f.timeFrom;
                        tempForecastObj.to = f.timeTo;

                        if (f.probability) {
                            let tempProbabilityObj = {
                                probabilityCode: `PROB${f.probability}`,
                                probability: f.probability,
                                description: "Probable condition in the period between"
                            };
                            tempForecastObj.probability = { ...tempProbabilityObj };
                        }

                        if (f.fcstChange) {
                            let tempForecastType = {};
                            const fcstCode = f.fcstChange;
                            let tempForecast = tafForecastType.find((f) => f.code === fcstCode);
                            if (tempForecast) {
                                tempForecastType.code = tempForecast.code;
                                tempForecastType.text = tempForecast.name;
                                tempForecastType.description = tempForecast.description;
                                tempForecastObj.forecastType = { ...tempForecastType };
                            }
                        }
                        if (f.wdir) {
                            tempForecastObj.wind.windDirection = f.wdir;
                        }
                        if (f.wspd) {
                            tempForecastObj.wind.windSpeedKt = f.wspd;
                        }
                        if (f.wgst) {
                            tempForecastObj.wind.windGustKt = f.wgst;
                        }
                        if (f.wshearHgt) {
                            tempForecastObj.wind.windshearHeight = f.wshearHgt;
                        }
                        if (f.wshearDir) {
                            tempForecastObj.wind.windshearDireaction = f.wshearDir;
                        }
                        if (f.wshearSpd) {
                            tempForecastObj.wind.windShearSpeed = f.wshearSpd;
                        }
                        if (f.visib) {
                            tempForecastObj.visibilityMile = f.visib;
                        }
                        if (f.clouds) {
                            const skyConditionArray = [];
                            f.clouds.map((s) => {
                                let tempSkyCondition = {};
                                let tempCloudObject;

                                if (s.cover) {
                                    if (s.cover.includes("CAVOK")) {
                                        tempSkyCondition.cloudCode = "CAVOK";
                                        tempSkyCondition.cloudText = "Clouds and visibility are OK";
                                        skyConditionArray.push(tempSkyCondition);
                                        return;
                                    }

                                    if (
                                        /(\bSKC\b)|(\bOVX\b)|(\bNCD\b)|(\bNSC\b)|(\bCLR\b)/g.test(
                                            s.cover
                                        )
                                    ) {
                                        if (s.cover.match("SKC")) {
                                            skyConditionArray.push({
                                                cloudCode: "SKC",
                                                cloudText: "Sky clear"
                                            });
                                            return;
                                        }
                                        if (s.cover.match("NCD")) {
                                            skyConditionArray.push({
                                                cloudCode: "NCD",
                                                cloudText: "No cloud detected"
                                            });
                                            return;
                                        }
                                        if (s.cover.match("NSC")) {
                                            skyConditionArray.push({
                                                cloudCode: "NSC",
                                                cloudText: "No significant cloud"
                                            });
                                            return;
                                        }
                                        if (s.cover.match("CLR")) {
                                            skyConditionArray.push({
                                                cloudCode: "CLR",
                                                cloudText: "Clear sky"
                                            });
                                            return;
                                        }
                                        if (s.cover.match("OVX")) {
                                            skyConditionArray.push({
                                                cloudCode: "OVX",
                                                cloudText: "Obscured Sky"
                                            });
                                            return;
                                        }
                                    }

                                    tempCloudObject = metarCloudCode.find(
                                        (c) => c.code === s.cover
                                    );
                                    tempSkyCondition.cloudCode = tempCloudObject.code;
                                    tempSkyCondition.cloudText = tempCloudObject.name;
                                    tempSkyCondition.cloudDensity = tempCloudObject.density;
                                    tempSkyCondition.cloudBaseAgl = s.base;
                                }
                                skyConditionArray.push(tempSkyCondition);
                            });
                            tempForecastObj.skyCondition = skyConditionArray;
                        }
                        if (f.wxString) {
                            let weatherStr = f.wxString.split(" ");
                            this.#generateWeather(weatherStr);
                            tempForecastObj.weather = this.weather;
                        }
                        tempParsedTaf.forecast.push(tempForecastObj);
                    });
                }
                this.parsedForecast.push(tempParsedTaf);
            });
        }
        return this.parsedForecast;
    }

    getTafTime() {
        let responseArray = [];
        if (this.parsedWholeTaf) {
            this.parsedWholeTaf.map((taf) => {
                let tempObj = {
                    icao: taf?.icaoId,
                    issueTime: taf?.issueTime,
                    validTimeFrom: taf?.validTimeFrom,
                    validTimeTo: taf?.validTimeTo
                };
                responseArray.push(tempObj);
            });
        }
        return responseArray;
    }

    getTafStation() {
        let responseArray = [];
        if (this.parsedWholeTaf) {
            this.parsedWholeTaf.map((taf) => {
                let tempObj = {
                    station: taf?.icaoId,
                    geometry: [taf?.lon, taf?.lat]
                };
                responseArray.push(tempObj);
            });
        }
        return responseArray;
    }
}

module.exports = TafFeatures;
