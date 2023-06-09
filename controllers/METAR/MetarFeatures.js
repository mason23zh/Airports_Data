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
const earthRadiusInMile = 3963.19;

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
        this.metarArray = [];
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
     Covert either Metar from db or Redis into the same format
     **/
    #normalizeMetar() {
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

    async requestNearestMetar_LngLat(lon, lat, decode = false) {
        try {
            if (!lon || !lat) return [];
            const responseMetars = await AwcWeatherMetarModel.find({
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [lon, lat],
                        },
                        $maxDistance: 200000,
                        $minDistance: 10,
                    },
                },
            });
            if (!responseMetars || responseMetars.length === 0) {
                return this.metarArray;
            }
            if (!decode) {
                this.metarArray.push(responseMetars[0].raw_text);
                return this.metarArray;
            } else {
                this.metarArray.push(this.convertGeneralResponseMetar(responseMetars[0].toJSON()));
                return this.metarArray;
            }
        } catch (e) {
            return [];
        }
    }

    async requestNearestMetar_icao(icao, decode = false) {
        try {
            if (!icao) return [];
            const originMetar = await this.requestMetarUsingICAO(icao);
            if (!originMetar) return [];
            const station = originMetar.getStation();
            const [lon, lat] = station.location.geometry.coordinates;

            return await this.requestNearestMetar_LngLat(lon, lat, decode);
        } catch (e) {
            return [];
        }
    }

    async requestMetarWithinRadius_LngLat(lon, lat, distance, decode = false) {
        try {
            if (!lon || !lat || !distance) return [];
            const responseMetar = await this.repo
                .search()
                .where("location_redis")
                .inRadius((circle) => circle.longitude(lon).latitude(lat).radius(distance).miles)
                .return.all();
            if (responseMetar && responseMetar.length !== 0) {
                this.metarArray = [];
                responseMetar.map((metar) => {
                    if (!decode) {
                        this.metarArray.push(metar.raw_text);
                    } else {
                        this.metarArray.push(this.convertGeneralResponseMetar(metar.toJSON()));
                    }
                });
                return this.metarArray;
            } else {
                throw 1;
            }
        } catch (e) {
            const responseMetars = await AwcWeatherMetarModel.find({
                location: {
                    $geoWithin: {
                        $centerSphere: [[lon, lat], distance / earthRadiusInMile],
                    },
                },
            });
            if (!responseMetars) {
                return [];
            }
            this.metarArray = [];
            responseMetars.map((metar) => {
                if (!decode) {
                    this.metarArray.push(metar.raw_text);
                } else {
                    this.metarArray.push(this.convertGeneralResponseMetar(metar.toJSON()));
                }
            });
            return this.metarArray;
        }
    }

    // radius is in mile.
    async requestMetarWithinRadius_icao(icao, distance, decode = false) {
        try {
            const originMetar = await this.requestMetarUsingICAO(icao);
            if (!originMetar) return [];
            const station = originMetar.getStation();
            const [lon, lat] = station.location.geometry.coordinates;
            return await this.requestMetarWithinRadius_LngLat(lon, lat, distance, decode);
        } catch (e) {
            return [];
        }
    }

    async requestMetarUsingGenericInput(data, decode = false) {
        try {
            const redisMetar = await this.repo.where("name").matches(data).or("municipality").match(data).returnAll();
            if (redisMetar && redisMetar.length !== 0) {
                this.metarArray = [];
                redisMetar.map((metar) => {
                    this.metarArray.push(this.convertGeneralResponseMetar(metar.toJSON()));
                });
                return this.metarArray;
            } else {
                throw 1;
            }
        } catch (e) {
            const dbMetars = await this.model.find({
                $or: [
                    {
                        municipality: {
                            $regex: `${data}`,
                            $options: "i",
                        },
                    },
                    { name: { $regex: `${data}`, $options: "i" } },
                ],
            });
            if (!dbMetars) {
                this.metarArray = [];
                return this.metarArray;
            }

            this.metarArray = [];
            dbMetars.map((metar) => {
                if (!decode) {
                    this.metarArray.push(metar.raw_text);
                } else {
                    this.metarArray.push(this.convertGeneralResponseMetar(metar.toJSON()));
                }
            });
            return this.metarArray;
        }
    }

    async requestMetarUsingAirportName(name, decode = false) {
        try {
            const redisMetar = await this.repo.search().where("name").matches(name).returnAll();
            if (redisMetar && redisMetar.length !== 0) {
                this.metarArray = [];
                redisMetar.map((metar) => {
                    if (!decode) {
                        this.metarArray.push(metar.raw_text);
                    } else {
                        this.metarArray.push(this.convertGeneralResponseMetar(metar.toJSON()));
                    }
                });
                return this.metarArray;
            } else {
                throw 1;
            }
        } catch (e) {
            const dbMetars = await this.model.find({ name: { $regex: `${name}`, $options: "i" } });
            if (!dbMetars) {
                this.metarArray = [];
                return this.metarArray;
            }

            this.metarArray = [];
            dbMetars.map((metar) => {
                if (!decode) {
                    this.metarArray.push(metar.raw_text);
                } else {
                    this.metarArray.push(this.convertGeneralResponseMetar(metar.toJSON()));
                }
            });
            return this.metarArray;
        }
    }

    async requestMetarCategory_global(category, sort = 1, limit = 10, decode = false) {
        const sortQuery = Number(sort) === 1 ? "ASC" : "DESC";
        try {
            const redisMetar = await this.repo
                ?.search()
                .where(category)
                .not.eq(0)
                .sortBy(category, sortQuery)
                .returnPage(0, Number(limit));
            if (redisMetar && redisMetar.length !== 0) {
                this.metarArray = [];
                redisMetar.map((metar) => {
                    if (!decode) {
                        this.metarArray.push(metar.raw_text);
                    } else {
                        this.metarArray.push(this.convertGeneralResponseMetar(metar.toJSON()));
                    }
                });
                return this.metarArray;
            } else {
                throw 1;
            }
        } catch (e) {
            const dbMetars = await this.model
                .find({
                    category: { $ne: null },
                })
                .sort({ category: sort })
                .limit(limit);

            if (!dbMetars || dbMetars.length === 0) {
                return [];
            }
            this.metarArray = [];
            dbMetars.map((metar) => {
                if (!decode) {
                    this.metarArray.push(metar.raw_text);
                } else {
                    this.metarArray.push(this.convertGeneralResponseMetar(metar.toJSON()));
                }
            });
            return this.metarArray;
        }
    }

    async requestMetarCategory_local(scope, target, category, sort = 1, limit = 10, decode = false) {
        const sortQuery = Number(sort) === 1 ? "ASC" : "DESC";

        try {
            const redisMetar = await this.repo
                ?.search()
                .where(scope)
                .equals(target.toUpperCase())
                .where(category)
                .not.eq(0)
                .sortBy(category, sortQuery)
                .returnPage(0, Number(limit));

            if (redisMetar && redisMetar.length > 0) {
                this.metarArray = [];
                redisMetar.map((metar) => {
                    if (!decode) {
                        this.metarArray.push(metar.raw_text);
                    } else {
                        this.metarArray.push(this.convertGeneralResponseMetar(metar.toJSON()));
                    }
                });
                return this.metarArray;
            } else {
                throw 1;
            }
        } catch (e) {
            const dbMetar = await this.model
                .find({
                    $and: [{ ios_country: target.toUpperCase() }, { category: { $ne: null } }],
                })
                .sort({ category: sort })
                .limit(limit);

            if (!dbMetar || dbMetar.length === 0) {
                return [];
            }
            this.metarArray = [];
            dbMetar.map((metar) => {
                if (!decode) {
                    this.metarArray.push(metar.raw_text);
                } else {
                    this.metarArray.push(this.convertGeneralResponseMetar(metar.toJSON()));
                }
            });
            return this.metarArray;
        }
    }

    async requestMetarUsingICAO(icao) {
        try {
            const redisMetar = await this.repo?.search().where("station_id").equals(icao.toUpperCase()).returnFirst();
            if (redisMetar && redisMetar.length !== 0) {
                this.metar = redisMetar.toJSON();
                this.#normalizeMetar();
                this.#generateDecodedMetar();
                return this;
            } else {
                throw 1;
            }
        } catch (e) {
            const dbMetar = await AwcWeatherMetarModel.findOne({ station_id: icao.toUpperCase() });
            if (!dbMetar) {
                return null;
            }

            this.metar = dbMetar.toObject();
            this.#normalizeMetar();
            this.#generateDecodedMetar();
            return this;
        }
    }

    /**
     * construct new barometer object
     **/
    #generateBarometer() {
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
    #generateCloud() {
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
            // console.log(code);
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

    #filterWeatherConditionCode(rawMetarArray, weatherCodeArray) {
        return rawMetarArray.filter((element) => weatherCodeArray.some((item) => element.includes(item)));
    }

    /**
     * Construct weather condition array
     **/
    #generateWeather() {
        const rawMetarSection = this.normalizedMetar.raw_text.split(" ");

        // get weatherCode key
        const weatherCodeKey = Object.keys(metarWeatherCode);
        const partialMatchedCode = this.#filterWeatherConditionCode(rawMetarSection, weatherCodeKey);

        for (let i = 0; i < partialMatchedCode.length; i++) {
            let intensityFlag;
            // check if weather code has intensity flag;
            if (partialMatchedCode[i].includes("+") || partialMatchedCode[i].includes("-")) {
                intensityFlag = partialMatchedCode[i].slice(0, 1);
                const tempWeatherCode = partialMatchedCode[i].slice(1);
                const tempWeatherText = this.#decodeWeatherCode(tempWeatherCode);
                if (tempWeatherText && tempWeatherText.length !== 0) {
                    let text = intensityFlag ? `${metarWeatherCode[intensityFlag]}${tempWeatherText}` : "";
                    this.weather.push({ code: partialMatchedCode[i], text: text });
                }
            } else {
                let text = this.#decodeWeatherCode(partialMatchedCode[i]);
                if (text && text.length !== 0) {
                    this.weather.push({ code: partialMatchedCode[i], text: text });
                }
            }
        }
        return this;
    }

    /**
     * Construct wind
     **/
    #generateWind() {
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
    #generateVisibility() {
        const { visibility_statute_mi } = this.normalizedMetar;
        if (visibility_statute_mi === null) {
            return;
        }
        this.visibility.miles_float = Number(visibility_statute_mi);
        this.visibility.meters_float = Number(statuteMiToMeter(visibility_statute_mi));

        return this;
    }

    /**
     * Construct temperature
     **/
    #generateTemperature() {
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
    #generateDewpoint() {
        const { dewpoint_c } = this.normalizedMetar;
        if (this.normalizedMetar.dewpoint_c) {
            this.dewpoint.celsius = Number(dewpoint_c);
            this.dewpoint.fahrenheit = celsiusToFahrenheit(dewpoint_c);
        }
        return this;
    }

    /**
     * Construct dewpoint
     **/
    #generateHumidity() {
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
    #generateElevation() {
        if (this.normalizedMetar.elevation_m) {
            this.elevation.feet = Number(meterToFeet(this.normalizedMetar.elevation_m));
            this.elevation.meters = Number(this.normalizedMetar.elevation_m);
        }
        return this;
    }

    /**
     * Construct ICAO
     **/
    #generateICAO() {
        if (this.normalizedMetar.station_id) {
            this.icao = this.normalizedMetar.station_id.toUpperCase();
        }
        return this;
    }

    /**
     * Construct Station
     **/
    #generateStation() {
        const coordinate = this.normalizedMetar.location || null;

        const location = {
            continent: this.normalizedMetar.continent || "",
            country: this.normalizedMetar.ios_country || "",
            region: this.normalizedMetar.ios_region || "",
            city: this.normalizedMetar.municipality || "",
            name: this.normalizedMetar.name || "",
            geometry: {
                coordinates: coordinate,
                type: "Point",
            },
        };
        this.station = { location: { ...location } };
        return this;
    }

    /**
     * Construct decoded Metar
     **/
    #generateDecodedMetar() {
        if (Object.keys(this.normalizedMetar).length === 0) {
            return null;
        }
        this.#generateBarometer();
        this.#generateHumidity();
        this.#generateWind();
        this.#generateCloud();
        this.#generateVisibility();
        this.#generateTemperature();
        this.#generateDewpoint();
        this.#generateElevation();
        this.#generateWeather();
        this.#generateICAO();
        this.#generateStation();

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
        return this;
    }

    convertGeneralResponseMetar(metar) {
        if (!metar) {
            return null;
        }
        this.metar = { ...metar };
        this.#normalizeMetar();
        this.#generateDecodedMetar();
        return this.decodedMetar;
    }

    getMetarArray() {
        return this.metarArray;
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

    /**
     * return the normalized metar format without any name changes.
     **/
    getNormalMetar() {
        return this.normalizedMetar;
    }

    getRawMetar() {
        return this.normalizedMetar.raw_text;
    }
}

module.exports = MetarFeatures;
