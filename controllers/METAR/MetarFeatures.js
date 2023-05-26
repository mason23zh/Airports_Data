const { AwcWeatherMetarModel } = require("../../models/weather/awcWeatherModel");
const { metarCloudCode, metarWeatherCode } = require("./constants");

// noinspection JSUnresolvedFunction
class MetarFeatures {
    constructor(model, repo) {
        this.repo = repo;
        this.model = model;
        this.metar = {};
        this.normalizedMetar = {};
        this.formattedMetar = {};
        this.clouds = [];
        this.weather = [];
        this.barometer = {};
        this.wind = {};
    }

    /**
     Covert either Metar from db or Reids into the same format
     **/
    normalizeMetar() {
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
        const redisMetar = await this.repo.search().where("station_id").equals(icao.toUpperCase()).returnFirst();
        if (redisMetar && redisMetar.length !== 0) {
            this.metar = JSON.parse(JSON.stringify(redisMetar));
        } else {
            const dbMetar = await AwcWeatherMetarModel.findOne({ station_id: icao.toUpperCase() });
            if (dbMetar) {
                this.metar = dbMetar.toObject();
            }
        }
        this.normalizeMetar();
        return this.metar;
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
                if (metarWeatherCode[tempWeatherCode]) {
                    let text = intensityFlag
                        ? `${metarWeatherCode[intensityFlag]} ${metarWeatherCode[tempWeatherCode]}`
                        : "";
                    this.weather.push({ code: rawMetarSection[i], text: text });
                }
            }
            if (metarWeatherCode[rawMetarSection[i]]) {
                this.weather.push({ code: rawMetarSection[i], text: metarWeatherCode[rawMetarSection[i]] });
            }
        }
        return this;
    }

    /**
     * Construct wind
     **/
    generateWind() {}

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
