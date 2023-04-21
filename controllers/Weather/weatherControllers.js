// noinspection JSUnresolvedVariable,JSCheckFunctionSignatures

require("dotenv").config({ path: "../../config.env" });
const { AwcWeatherMetarModel } = require("../../models/weather/awcWeatherModel");
const NotFoundError = require("../../common/errors/NotFoundError");
const { awcMetarRepository } = require("../../redis/awcMetar");

module.exports.getWeatherForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { limit = 30 } = req.query;
    const repo = await awcMetarRepository();

    const sortedMetars = await repo
        .search()
        .where("ios_country")
        .equals(country.toUpperCase())
        .returnPage(0, Number(limit));

    if (sortedMetars.length !== 0) {
        return res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    } else {
        const sortedMetars = await AwcWeatherMetarModel.find({ ios_country: country.toUpperCase() }).limit(limit);

        if (!sortedMetars || sortedMetars.length === 0) {
            throw new NotFoundError(`Cannot find METARs data for country: ${country}`);
        }

        res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    }
};

module.exports.getWindGustForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { limit = 10 } = req.query;
    const repo = await awcMetarRepository();

    const sortedMetars = await repo
        .search()
        .where("ios_country")
        .equals(country.toUpperCase())
        .sortDesc("wind_gust_kt")
        .returnPage(0, Number(limit));

    if (sortedMetars.length !== 0) {
        return res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    } else {
        const sortedMetars = await AwcWeatherMetarModel.find({
            ios_country: country.toUpperCase(),
            wind_gust_kt: { $ne: null },
        })
            .sort({ wind_gust_kt: -1 })
            .limit(limit);

        if (!sortedMetars || sortedMetars.length === 0) {
            throw new NotFoundError(`Cannot find wind gust data for country: ${country}`);
        }

        res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    }
};

module.exports.getWindMetarForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { limit = 10 } = req.query;
    const repo = await awcMetarRepository();

    const sortedMetars = await repo
        .search()
        .where("ios_country")
        .equals(country.toUpperCase())
        .sortDesc("wind_speed_kt")
        .returnPage(0, Number(limit));

    if (sortedMetars.length !== 0) {
        return res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    } else {
        const sortedMetars = await AwcWeatherMetarModel.find({
            ios_country: country.toUpperCase(),
            wind_speed_kt: { $ne: null },
        })
            .sort({ wind_speed_kt: -1 })
            .limit(limit);

        if (!sortedMetars || sortedMetars.length === 0) {
            throw new NotFoundError(`Cannot find wind gust data for country: ${country}`);
        }

        res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    }
};

module.exports.getBaroMetarForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { sort = 1, limit = 10 } = req.query; // 1 would sort low baro to high
    const repo = await awcMetarRepository();
    const sortQuery = Number(sort) === 1 ? "ASC" : "DESC";

    const sortedMetars = await repo
        .search()
        .where("continent")
        .equals(country.toUpperCase())
        .sortBy("altim_in_hg", sortQuery)
        .where("altim_in_hg")
        .not.eq(0)
        .returnPage(0, Number(limit));

    if (sortedMetars.length !== 0) {
        return res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    } else {
        const sortedMetars = await AwcWeatherMetarModel.find({
            ios_country: country.toUpperCase(),
            altim_in_hg: { $ne: null },
        })
            .sort({ altim_in_hg: sort })
            .limit(limit);

        if (!sortedMetars || sortedMetars.length === 0) {
            throw new NotFoundError(`Cannot find baro data for country: ${country}`);
        }

        res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    }
};

module.exports.getVisibilityMetarForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { sort = 1, limit = 10 } = req.query; //1 would sort bad visibility from good
    const repo = await awcMetarRepository();
    const sortQuery = Number(sort) === 1 ? "ASC" : "DESC";

    const sortedMetars = await repo
        .search()
        .where("ios_country")
        .equals(country.toUpperCase())
        .sortBy("visibility_statute_mi", sortQuery)
        .where("visibility_statute_mi")
        .not.eq(0)
        .returnPage(0, Number(limit));

    if (sortedMetars.length !== 0) {
        return res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    } else {
        const sortedMetars = await AwcWeatherMetarModel.find({
            ios_country: country.toUpperCase(),
            visibility_statute_mi: { $ne: null },
        })
            .sort({ visibility_statute_mi: sort })
            .limit(limit);

        if (!sortedMetars || sortedMetars.length === 0) {
            throw new NotFoundError(`Cannot find visibility data for country: ${country}`);
        }

        res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    }
};

module.exports.getTempMetarForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { sort = 1, limit = 10 } = req.query; //1 would sort temp from low to high
    const repo = await awcMetarRepository();
    const sortQuery = Number(sort) === 1 ? "ASC" : "DESC";

    const sortedMetars = await repo
        .search()
        .where("ios_country")
        .equals(country.toUpperCase())
        .sortBy("temp_c", sortQuery)
        .returnPage(0, Number(limit));

    if (sortedMetars.length !== 0) {
        return res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    } else {
        const sortedMetars = await AwcWeatherMetarModel.find({
            ios_country: country.toUpperCase(),
            temp_c: { $ne: null },
        })
            .sort({ temp_c: sort })
            .limit(limit);

        if (!sortedMetars || sortedMetars.length === 0) {
            throw new NotFoundError(`Cannot find temperature data for country: ${country}`);
        }

        res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    }
};

//continent
module.exports.getMetarForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { limit = 10 } = req.query;
    const repo = await awcMetarRepository();

    const sortedMetars = await repo
        .search()
        .where("continent")
        .equals(continent.toUpperCase())
        .returnPage(0, Number(limit));

    if (sortedMetars.length !== 0) {
        return res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    } else {
        const sortedMetars = await AwcWeatherMetarModel.find({ continent: continent.toUpperCase() }).limit(limit);

        if (!sortedMetars || sortedMetars.length === 0) {
            throw new NotFoundError(
                `Can not find METARs for continent: ${continent}. Please use the correct continent code.`
            );
        }

        res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    }
};

module.exports.getWindGustForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { limit = 10 } = req.query;
    const repo = await awcMetarRepository();

    const sortedMetars = await repo
        .search()
        .where("continent")
        .equals(continent.toUpperCase())
        .sortDesc("wind_gust_kt")
        .returnPage(0, Number(limit));

    if (sortedMetars.length !== 0) {
        return res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    } else {
        const sortedMetars = await AwcWeatherMetarModel.find({
            continent: continent.toUpperCase(),
            wind_gust_kt: { $ne: null },
        })
            .sort({ wind_gust_kt: -1 })
            .limit(limit);

        if (!sortedMetars || sortedMetars.length === 0) {
            throw new NotFoundError(`Cannot find wind gust data for continent: ${continent}
            Please use code: AF, AN, AS, OC, EU, NA, SA`);
        }

        res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    }
};

module.exports.getWindMetarForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { limit = 10 } = req.query;
    const repo = await awcMetarRepository();

    const sortedMetars = await repo
        .search()
        .where("continent")
        .equals(continent.toUpperCase())
        .sortDesc("wind_speed_kt")
        .returnPage(0, Number(limit));

    if (sortedMetars.length !== 0) {
        return res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    } else {
        const sortedMetars = await AwcWeatherMetarModel.find({
            continent: continent.toUpperCase(),
            wind_speed_kt: { $ne: null },
        })
            .sort({ wind_speed_kt: -1 })
            .limit(limit);

        if (!sortedMetars || sortedMetars.length === 0) {
            throw new NotFoundError(
                `Cannot find wind speed data for continent: ${continent}
            Please use code: AF, AN, AS, OC, EU, NA, SA`
            );
        }

        res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    }
};

module.exports.getBaroMetarForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { sort = 1, limit = 10 } = req.query; //1 would sort baro from low to high
    const repo = await awcMetarRepository();
    const sortQuery = Number(sort) === 1 ? "ASC" : "DESC";

    const sortedMetars = await repo
        .search()
        .where("continent")
        .equals(continent.toUpperCase())
        .where("altim_in_hg")
        .not.eq(0)
        .sortBy("altim_in_hg", sortQuery)
        .returnPage(0, Number(limit));

    if (sortedMetars.length !== 0) {
        return res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    } else {
        const sortedMetars = await AwcWeatherMetarModel.find({
            continent: continent.toUpperCase(),
            altim_in_hg: { $ne: null },
        })
            .sort({ altim_in_hg: sort })
            .limit(limit);

        if (!sortedMetars || sortedMetars.length === 0) {
            throw new NotFoundError(
                `Cannot find bara data for continent: ${continent}
            Please use code: AF, AN, AS, OC, EU, NA, SA`
            );
        }

        res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    }
};

module.exports.getVisibilityMetarForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { sort = 1, limit = 10 } = req.query; //1 would sort visibility from low to high
    const repo = await awcMetarRepository();
    const sortQuery = Number(sort) === 1 ? "ASC" : "DESC";

    const sortedMetars = await repo
        .search()
        .where("continent")
        .equals(continent.toUpperCase())
        .where("visibility_statute_mi")
        .not.eq(0)
        .sortBy("visibility_statute_mi", sortQuery)
        .returnPage(0, Number(limit));

    if (sortedMetars.length !== 0) {
        return res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    } else {
        const sortedMetars = await AwcWeatherMetarModel.find({
            continent: continent.toUpperCase(),
            visibility_statute_mi: { $ne: null },
        })
            .sort({ visibility_statute_mi: sort })
            .limit(limit);

        if (!sortedMetars || sortedMetars.length === 0) {
            throw new NotFoundError(
                `Cannot find visibility data for continent: ${continent}
            Please use code: AF, AN, AS, OC, EU, NA, SA`
            );
        }

        res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    }
};

module.exports.getTempMetarForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { sort = 1, limit = 10 } = req.query; //1 would sort temperature from low to high
    const repo = await awcMetarRepository();
    const sortQuery = Number(sort) === 1 ? "ASC" : "DESC";

    const sortedMetars = await repo
        .search()
        .where("continent")
        .equals(continent.toUpperCase())
        .sortBy("temp_c", sortQuery)
        .returnPage(0, Number(limit));

    if (sortedMetars.length !== 0) {
        return res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    } else {
        const sortedMetars = await AwcWeatherMetarModel.find({
            continent: continent.toUpperCase(),
            temp_c: { $ne: null },
        })
            .sort({ temp_c: sort })
            .limit(limit);

        if (!sortedMetars || sortedMetars.length === 0) {
            throw new NotFoundError(
                `Cannot find temperature data for continent: ${continent}
            Please use code: AF, AN, AS, OC, EU, NA, SA`
            );
        }

        res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    }
};

// Global

module.exports.getWindGustForGlobal = async (req, res, next) => {
    const { limit = 10 } = req.query;
    const repo = await awcMetarRepository();

    const sortedMetars = await repo
        .search()
        .where("wind_gust_kt")
        .not.eq(0)
        .sortDesc("wind_gust_kt")
        .returnPage(0, Number(limit));

    if (sortedMetars.length !== 0) {
        return res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    } else {
        const sortedMetars = await AwcWeatherMetarModel.find({
            wind_gust_kt: { $ne: null },
        })
            .sort({ wind_gust_kt: -1 })
            .limit(limit);

        if (!sortedMetars || sortedMetars.length === 0) {
            throw new NotFoundError(`Cannot find global temperature data.`);
        }

        res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    }
};

module.exports.getWindMetarForGlobal = async (req, res, next) => {
    const { limit = 10 } = req.query;
    const repo = await awcMetarRepository();

    const sortedMetars = await repo
        .search()
        .where("wind_speed_kt")
        .not.eq(0)
        .sortDesc("wind_speed_kt")
        .returnPage(0, Number(limit));

    if (sortedMetars.length !== 0) {
        return res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    } else {
        const sortedMetars = await AwcWeatherMetarModel.find({
            wind_speed_kt: { $ne: null },
        })
            .sort({ wind_speed_kt: -1 })
            .limit(limit);

        if (!sortedMetars || sortedMetars.length === 0) {
            throw new NotFoundError(`Cannot find global temperature data.`);
        }

        res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    }
};

module.exports.getBaroMetarForGlobal = async (req, res, next) => {
    const { sort = 1, limit = 10 } = req.query;
    const repo = await awcMetarRepository();
    const sortQuery = Number(sort) === 1 ? "ASC" : "DESC";

    const sortedMetars = await repo
        .search()
        .where("altim_in_hg")
        .not.eq(0)
        .sortBy("altim_in_hg", sortQuery)
        .returnPage(0, Number(limit));

    if (sortedMetars.length !== 0) {
        return res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    } else {
        const sortedMetars = await AwcWeatherMetarModel.find({
            altim_in_hg: { $ne: null },
        })
            .sort({ altim_in_hg: sort })
            .limit(limit);

        if (!sortedMetars || sortedMetars.length === 0) {
            throw new NotFoundError(`Cannot find global baro data.`);
        }

        res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    }
};

module.exports.getVisibilityMetarForGlobal = async (req, res, next) => {
    const { sort = 1, limit = 10 } = req.query;
    const repo = await awcMetarRepository();
    const sortQuery = Number(sort) === 1 ? "ASC" : "DESC";

    const sortedMetars = await repo
        .search()
        .where("visibility_statute_mi")
        .not.eq(0)
        .sortBy("visibility_statute_mi", sortQuery)
        .returnPage(0, Number(limit));

    if (sortedMetars.length !== 0) {
        return res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    } else {
        const sortedMetars = await AwcWeatherMetarModel.find({
            visibility_statute_mi: { $ne: null },
        })
            .sort({ visibility_statute_mi: sort })
            .limit(limit);

        if (!sortedMetars || sortedMetars.length === 0) {
            throw new NotFoundError(`Cannot find global visibility data.`);
        }

        res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    }
};

module.exports.getTempMetarForGlobal = async (req, res, next) => {
    const { sort = 1, limit = 10 } = req.query;
    const repo = await awcMetarRepository();
    const sortQuery = Number(sort) === 1 ? "ASC" : "DESC";

    const sortedMetars = await repo.search().sortBy("temp_c", sortQuery).returnPage(0, Number(limit));

    if (sortedMetars.length !== 0) {
        return res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    } else {
        const sortedMetars = await AwcWeatherMetarModel.find({
            temp_c: { $ne: null },
        })
            .sort({ temp_c: sort })
            .limit(limit);

        if (!sortedMetars || sortedMetars.length === 0) {
            throw new NotFoundError(`Cannot find global temperature data.`);
        }

        res.status(200).json({
            status: "success",
            result: sortedMetars.length,
            data: sortedMetars,
        });
    }
};
