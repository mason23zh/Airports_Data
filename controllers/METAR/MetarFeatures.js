const { AwcWeatherMetarModel } = require("../../models/weather/awcWeatherModel");

// noinspection JSUnresolvedFunction
class MetarFeatures {
    constructor(model, repo) {
        this.repo = repo;
        this.model = model;
        this.metar = {};
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
            this.metar = rest;
        } else {
            const { _id, location, __v, auto, ...rest } = this.metar;
            rest.location = this.metar.location.coordinates;
            rest.wind_speed_kt = this.metar.wind_speed_kt || 0;
            rest.wind_gust_kt = this.metar.wind_gust_kt || 0;

            this.metar = rest;
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

    getNormalMetar() {
        return this.metar;
    }

    getRawMetar() {
        return this.metar.raw_text;
    }
}

module.exports = MetarFeatures;
