const NotFoundError = require("../../common/errors/NotFoundError");

class MetarFeatures {
    constructor(repo, model) {
        this.repo = repo;
        this.model = model;
        this.response = null;
    }

    async getMetarUsingICAO(icao, decode) {
        const responseMetar = await this.repo.where("station_id").equals(icao.toUpperCase()).returnAll();
        console.log("response metar", responseMetar);
        if (responseMetar && responseMetar.length !== 0) {
            console.log("response metar", JSON.parse(JSON.stringify(responseMetar[0])));
            if (decode === "false") {
                let tempObj = JSON.parse(JSON.stringify(responseMetar[0]));
                return tempObj.raw_text;
            } else {
                return responseMetar;
            }
        } else {
            const responseMetar = await this.model.find({ station_id: `${icao.toUpperCase()}` });
            if (!responseMetar || responseMetar.length === 0) {
                throw new NotFoundError(`Cannot find METARs data for airport with ICAO code: ${icao}`);
            }

            if (decode === "false") {
                let tempObj = JSON.parse(responseMetar[0]);
                return tempObj.raw_text;
            }
            return responseMetar;
        }
    }
}

module.exports = MetarFeatures;
