const { AwcWeatherMetarModel } = require("../../models/weather/awcWeatherModel");
const { metarCloudCode, metarWeatherCode } = require("./constants");
const {
    ktsToMps,
    ktsTokph,
    ktsToMph,
    statuteMiToMeter,
    celsiusToFahrenheit,
    meterToFeet,
    calculateHumidity,
} = require("../../utils/METAR/convert");
const CustomError = require("../../common/errors/custom-error");

// noinspection JSUnresolvedFunction
class MetarFeatures {
    constructor(model, repo) {
        this.repo = repo;
        this.model = model;
        this.metar = {};
        this.normalizedMetar = {};
        this.decodedMetar = {};
        this.clouds = [];
        this.weather = [];
        this.barometer = {};
        this.wind = {};
        this.visibility = {};
        this.temperature = {};
        this.dewpoint = {};
        this.humidity = {};
        this.elevation = {};
        this.icao = "";
        this.station = {};
    }

    #clearEmpties(o) {
        for (let k in o) {
            if (!o[k] || typeof o[k] !== "object") {
                continue; // If null or not an object, skip to the next iteration
            }

            // The property is an object
            this.#clearEmpties(o[k]); // <-- Make a recursive call on the nested object
            if (Object.keys(o[k]).length === 0) {
                delete o[k]; // The object had no properties, so delete that property
            }
        }
        return o;
    }

    /**
     Covert either Metar from db or Reids into the same format
     **/
    normalizeMetar() {
        if (Object.keys(this.metar).length === 0) {
            this.normalizedMetar = {};
            return;
        }
        /* eslint-disable no-unused-vars */
        if (Object.hasOwn(this.metar, "entityId")) {
            const { longitude, latitude } = this.metar.location_redis;
            const location = [longitude, latitude];
            const { entityId, location_redis, auto, ...rest } = this.metar;
            rest.location = location;
            this.normalizedMetar = rest;
        } else {
            const { _id, location, __v, auto, ...rest } = this.metar;
            rest.location = this.metar.location.coordinates;
            rest.wind_speed_kt = this.metar.wind_speed_kt || 0;
            rest.wind_gust_kt = this.metar.wind_gust_kt || 0;

            this.normalizedMetar = rest;
        }
    }

    async requestMetarUsingICAO(icao) {
        try {
            const redisMetar = await this.repo.search().where("station_id").equals(icao.toUpperCase()).returnFirst();
            if (redisMetar && redisMetar.length !== 0) {
                this.metar = JSON.parse(JSON.stringify(redisMetar));
            } else {
                const dbMetar = await AwcWeatherMetarModel.findOne({ station_id: icao.toUpperCase() });
                if (!dbMetar || dbMetar.length === 0) {
                    return;
                }

                this.metar = dbMetar.toObject();
            }
            this.normalizeMetar();
            return this.metar;
        } catch (e) {
            throw new CustomError("Something went wrong, please come again later.", 500);
        }
    }

    formatMetar() {
        let tempMetar = {};
        tempMetar.raw_text = this.normalizedMetar.raw_text;
        tempMetar.icao = this.normalizedMetar.station_id;
        tempMetar.flight_category = this.normalizedMetar.flight_category;
        tempMetar.observation_time = this.normalizedMetar.observation_time;
    }

    /**
     * construct new barometer object
     **/
    generateBarometer() {
        if (this.normalizedMetar.altim_in_hg) {
            const originalBaro = Number(this.normalizedMetar.altim_in_hg);
            this.barometer.hg = originalBaro.toFixed(2);
            this.barometer.hpa = (originalBaro * 33.863889532610884).toFixed();
            this.barometer.kpa = (originalBaro * 3.38639).toFixed(2);
            this.barometer.mb = (originalBaro * 33.86).toFixed(2);
        }
        return this;
    }

    /**
     * construct cloud array
     */
    generateCloud() {
        this.clouds = [];
        if (this.normalizedMetar.raw_text) {
            let finalCloudObject = {};
            const rawMetar = this.normalizedMetar.raw_text;

            if (rawMetar.includes("CAVOK")) {
                this.clouds.push({ code: "CAVOK", text: "Clouds and visibility are OK" });
                return;
            }

            if (/(\bSKC\b)|(\bNCD\b)|(\bNSC\b)|(\bCLR\b)/g.test(rawMetar)) {
                if (rawMetar.match("SKC")) {
                    this.clouds.push({ code: "SKC", text: "Sky clear" });
                    return;
                }
                if (rawMetar.match("NCD")) {
                    this.clouds.push({ code: "NCD", text: "No cloud detected" });
                    return;
                }
                if (rawMetar.match("NSC")) {
                    this.clouds.push({ code: "NSC", text: "No significant cloud" });
                    return;
                }
                if (rawMetar.match("CLR")) {
                    this.clouds.push({ code: "CLR", text: "Clear sky" });
                    return;
                }
            }

            if (/((SCT)|(BKN)|(FEW)|(OVC))(\d{3})((CB)|(TCB))?/.test(rawMetar)) {
                let match = rawMetar.match(/((SCT)|(BKN)|(FEW)|(OVC))(\d{3})((CB)|(TCB))?/g).filter((section) => {
                    return section !== undefined && section.length !== 3;
                });
                if (match.length === 0) {
                    return;
                }
                match.forEach((section) => {
                    const cloudCode = section.slice(0, 3);
                    const cloudHeight = section.slice(3, 6);
                    const cloudCondition = section.length > 6 ? section.slice(6, section.length) : "";
                    let cloudAdditionalProperty;

                    let tempCloudObject = metarCloudCode.find((c) => c.code === cloudCode);
                    if (cloudCondition.length !== 0) {
                        cloudAdditionalProperty = metarCloudCode.find((c) => c.code === cloudCondition);
                    }
                    let updatedCloudObject = {
                        ...tempCloudObject,
                        feet: Number(cloudHeight) * 100,
                        base_feet_agl: Number(cloudHeight) * 100,
                        base_meters_agl: Number((Number(cloudHeight) * 30.48).toFixed()),
                    };
                    if (cloudAdditionalProperty) {
                        finalCloudObject = {
                            ...updatedCloudObject,
                            additional: { ...cloudAdditionalProperty },
                        };
                    } else {
                        finalCloudObject = {
                            ...updatedCloudObject,
                        };
                    }
                    this.clouds.push(finalCloudObject);
                });
            }
        }
        return this;
    }

    #decodeWeatherCode(code) {
        let weatherText = "";

        // check for special weather code
        if (code.length >= 4 && metarWeatherCode[code]) {
            weatherText = `${weatherText} ${metarWeatherCode[code]}`;
        }

        for (let i = 0; i < code.length - 1; i += 2) {
            const singleCode = code.slice(i, i + 2);
            if (metarWeatherCode[singleCode]) {
                weatherText = `${weatherText} ${metarWeatherCode[singleCode]}`;
            }
        }
        return weatherText;
    }

    /**
     * Construct weather condition array
     **/
    generateWeather() {
        const rawMetarSection = this.normalizedMetar.raw_text.split(" ");
        for (let i = 0; i < rawMetarSection.length; i++) {
            let intensityFlag;
            // check if weather code has intensity flag;
            if (rawMetarSection[i].includes("+") || rawMetarSection[i].includes("-")) {
                intensityFlag = rawMetarSection[i].slice(0, 1);
                const tempWeatherCode = rawMetarSection[i].slice(1);
                const tempWeatherText = this.#decodeWeatherCode(tempWeatherCode);
                //let text = intensityFlag ? `${metarWeatherCode[intensityFlag]} ${tempWeatherText}` : "";
                let text = intensityFlag ? `${metarWeatherCode[intensityFlag]}${tempWeatherText}` : "";
                this.weather.push({ code: rawMetarSection[i], text: text });
            }
            if (metarWeatherCode[rawMetarSection[i]]) {
                let text = this.#decodeWeatherCode(rawMetarSection[i]);
                this.weather.push({ code: rawMetarSection[i], text: text });
            }
        }
        return this;
    }

    /**
     * Construct wind
     **/
    generateWind() {
        const windSpeedKt = this.normalizedMetar.wind_speed_kt || 0;
        const windDirection = this.normalizedMetar.wind_dir_degrees;
        const windGustKt = this.normalizedMetar.wind_gust_kt || 0;
        this.wind.degrees = Number(windDirection);
        this.wind.speed_kts = Number(windSpeedKt);
        this.wind.speed_kph = Number(ktsTokph(windSpeedKt));
        this.wind.speed_mps = Number(ktsToMps(windSpeedKt));
        this.wind.speed_mph = Number(ktsToMph(windSpeedKt));
        if (windGustKt !== 0) {
            this.wind.gust_kts = Number(windGustKt);
            this.wind.gust_mps = Number(ktsToMps(windGustKt));
            this.wind.gust_kph = Number(ktsTokph(windGustKt));
            this.wind.gust_mph = Number(ktsToMph(windGustKt));
        }
        return this;
    }

    /**
     * Construct visibility
     **/
    generateVisibility() {
        const { visibility_statute_mi } = this.normalizedMetar;
        this.visibility.miles = visibility_statute_mi.toString();
        this.visibility.meters = statuteMiToMeter(visibility_statute_mi).toString();
        this.visibility.miles_float = Number(visibility_statute_mi);
        this.visibility.meters_float = Number(statuteMiToMeter(visibility_statute_mi));
        return this;
    }

    /**
     * Construct temperature
     **/
    generateTemperature() {
        const { temp_c } = this.normalizedMetar;
        if (temp_c) {
            this.temperature.celsius = Number(temp_c);
            this.temperature.fahrenheit = celsiusToFahrenheit(temp_c);
        }
        return this;
    }

    /**
     * Construct dewpoint
     **/
    generateDewpoint() {
        const { dewpoint_c } = this.normalizedMetar;
        if (dewpoint_c) {
            this.dewpoint.celsius = Number(dewpoint_c);
            this.dewpoint.fahrenheit = celsiusToFahrenheit(dewpoint_c);
        }
        return this;
    }

    /**
     * Construct dewpoint
     **/
    generateHumidity() {
        if (this.normalizedMetar.temp_c && this.normalizedMetar.dewpoint_c) {
            this.humidity.percent = Number(
                calculateHumidity(this.normalizedMetar.temp_c, this.normalizedMetar.dewpoint_c)
            );
        }
        return this;
    }

    /**
     * Construct elevation
     **/
    generateElevation() {
        if (this.normalizedMetar.elevation_m) {
            this.elevation.feet = Number(meterToFeet(this.normalizedMetar.elevation_m));
            this.elevation.meters = Number(this.normalizedMetar.elevation_m);
        }
        return this;
    }

    /**
     * Construct ICAO
     **/
    generateICAO() {
        if (this.normalizedMetar.station_id) {
            this.icao = this.normalizedMetar.station_id.toUpperCase();
        }
        return this;
    }

    /**
     * Construct Station
     **/
    generateStation() {
        const geometry = this.normalizedMetar.location || null;
        const location = {
            continent: this.normalizedMetar.continent || "",
            country: this.normalizedMetar.ios_country || "",
            region: this.normalizedMetar.ios_region || "",
            city: this.normalizedMetar.municipality || "",
            name: this.normalizedMetar.name || "",
        };
        this.station = { location: { ...location }, geometry: geometry };
        return this;
    }

    /**
     * Construct decoded Metar
     **/
    generateDecodedMetar() {
        if (Object.keys(this.normalizedMetar).length === 0) {
            return;
        }
        this.generateBarometer()
            .generateHumidity()
            .generateWind()
            .generateCloud()
            .generateVisibility()
            .generateTemperature()
            .generateDewpoint()
            .generateElevation()
            .generateWeather()
            .generateICAO()
            .generateStation();
        let tempDecodedMetar = {
            icao: this.icao,
            observed: this.normalizedMetar.observation_time,
            raw_text: this.normalizedMetar.raw_text,
            barometer: { ...this.barometer },
            wind: { ...this.wind },
            clouds: this.clouds,
            conditions: { ...this.weather },
            visibility: { ...this.visibility },
            temperature: { ...this.temperature },
            dewpoint: { ...this.dewpoint },
            humidity: { ...this.humidity },
            elevation: { ...this.elevation },
            flight_category: this.normalizedMetar.flight_category,
            station: { ...this.station },
        };
        this.decodedMetar = this.#clearEmpties(tempDecodedMetar);
    }

    getDecodedMetar() {
        return this.decodedMetar;
    }

    getStation() {
        return this.station;
    }

    getHumidity() {
        return this.humidity;
    }

    getElevation() {
        return this.elevation;
    }

    getTemperature() {
        return this.temperature;
    }

    getDewpoint() {
        return this.dewpoint;
    }

    getVisibility() {
        return this.visibility;
    }

    getWind() {
        return this.wind;
    }

    getBarometer() {
        return this.barometer;
    }

    getWeatherCondition() {
        return this.weather;
    }

    getClouds() {
        return this.clouds;
    }

    getNormalMetar() {
        return this.normalizedMetar;
    }

    getRawMetar() {
        return this.normalizedMetar.raw_text;
    }
}

module.exports = MetarFeatures;
