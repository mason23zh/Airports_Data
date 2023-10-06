const axios = require("axios");
const convert = require("xml-js");
const { metarWeatherCode } = require("../METAR/constants");
const _ = require("lodash");

class TafFeatures {
    constructor() {
        this.rawXMLTaf = "";
        this.parsedWholeTaf = undefined;
        this.parsedForecast = [];
        this.weather = [];
    }

    #convertXmlToJson() {
        if (this.rawXMLTaf.length > 0) {
            const result = convert.xml2json(this.rawXMLTaf, { compact: true, spaces: 1 });
            if (JSON.parse(result).response.data.TAF) {
                return JSON.parse(result).response.data.TAF;
            } else {
                return "";
            }
        }
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
            // console.log(singleCode);
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
     * Make request to NOAA and parse the XML
     * @param icao
     */
    async requestTaf(icao) {
        const url = `https://beta.aviationweather.gov/cgi-bin/data/dataserver.php?dataSource=tafs&requestType=retrieve&format=xml&hoursBeforeNow=3&timeType=issue&mostRecent=true&stationString=${icao.toUpperCase()}`;

        const response = await axios.get(url);
        if (response && response.data) {
            this.rawXMLTaf = response.data;
            this.parsedWholeTaf = this.#convertXmlToJson();
            return Promise.resolve(this);
        } else {
            this.rawXMLTaf = "";
            return Promise.reject(null);
        }
    }

    /**
     * Return the whole TAF without decode
     */
    getTaf() {
        if (this.rawXMLTaf) {
            this.parsedWholeTaf = this.#convertXmlToJson();
        }
        return this.parsedWholeTaf;
    }

    /**
     * Return the raw TAF
     */
    getRawTaf() {
        if (this.parsedWholeTaf) {
            return this.parsedWholeTaf.raw_text._text;
        } else {
            return "";
        }
    }

    /**
     * Decode and return the forecast section of TAF
     */
    getDecodeForecast() {
        if (this.parsedWholeTaf && this.parsedWholeTaf.forecast) {
            this.parsedWholeTaf.forecast.map((f) => {
                let tempForecastObj = { from: "", to: "", wind: {}, skyCondition: [] };
                tempForecastObj.from = f.fcst_time_from._text;
                tempForecastObj.to = f.fcst_time_to._text;
                if (f.change_indicator) {
                    tempForecastObj.forecastType = f.change_indicator._text;
                }
                if (f.wind_dir_degrees) {
                    tempForecastObj.wind.windDirection = f.wind_dir_degrees._text;
                }
                if (f.wind_speed_kt) {
                    tempForecastObj.wind.windSpeedKt = f.wind_speed_kt._text;
                }
                if (f.visibility_statute_mi) {
                    tempForecastObj.visibilityMile = f.visibility_statute_mi._text;
                }
                if (f.sky_condition) {
                    // check if sky_condition is an array
                    if (_.isArray(f.sky_condition)) {
                        const skyConditionArray = [];
                        f.sky_condition.map((s) => {
                            let tempSkyCondition = {};
                            tempSkyCondition.skyCover = s._attributes.sky_cover;
                            tempSkyCondition.cloudBaseAgl = s._attributes.cloud_base_ft_agl;
                            skyConditionArray.push(tempSkyCondition);
                        });
                        tempForecastObj.skyCondition = skyConditionArray;
                    } else {
                        // if sky_condition is NOT an array
                        let tempSkyCondition = {};
                        tempSkyCondition.skyCover = f.sky_condition._attributes.sky_cover;
                        tempSkyCondition.cloudBaseAgl =
                            f.sky_condition._attributes.cloud_base_ft_agl;
                        tempForecastObj.skyCondition = [{ ...tempSkyCondition }];
                    }
                }
                if (f.wx_string) {
                    let weatherStr = f.wx_string._text.split(" ");
                    this.#generateWeather(weatherStr);
                    tempForecastObj.weather = this.weather;
                }
                this.parsedForecast.push(tempForecastObj);
            });
        }
        return this.parsedForecast;
    }

    getTafTime() {
        if (this.parsedWholeTaf) {
            return {
                issueTime: this.parsedWholeTaf?.issue_time._text,
                validTimeFrom: this.parsedWholeTaf?.valid_time_from._text,
                validTimeTo: this.parsedWholeTaf?.valid_time_to._text
            };
        }
    }

    getTafStation() {
        if (this.parsedWholeTaf) {
            return {
                station: this.parsedWholeTaf?.station_id._text,
                geometry: [
                    this.parsedWholeTaf?.longitude._text,
                    this.parsedWholeTaf?.latitude._text
                ]
            };
        }
    }
}

module.exports = TafFeatures;
