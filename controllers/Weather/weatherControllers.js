const AwcWeather = require("../../utils/AWC_Weather/AwcWeather");
const NotFoundError = require("../../common/errors/NotFoundError");

const awcWeather = new AwcWeather();

//!TODO: Refactor
module.exports.getWeatherForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { limit = 30 } = req.query;
    let resultMetar = [];

    try {
        const tempMetars = await awcWeather.getWeatherForCountry(country);
        if (tempMetars.length > 0) {
            if (tempMetars.length > Number(limit)) {
                for (let i = 0; i < Number(limit); i++) {
                    resultMetar.push(tempMetars[i]);
                }
            } else {
                resultMetar = [...tempMetars];
            }
        }
    } catch (err) {
        throw new NotFoundError(`Cannot find weather for ${country.toUpperCase()}`);
    }

    res.status(200).json({
        status: "success",
        totalNumber: awcWeather.getNumberOfMetars(),
        result: resultMetar.length,
        data: {
            METAR: resultMetar,
        },
    });
};

module.exports.getWindGustForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { limit = 10 } = req.query;
    let resultMetar = [];
    try {
        await awcWeather.getWeatherForCountry(country);
        const tempMetar = awcWeather.getGustMetarFromHighToLow();
        if (tempMetar.length > 0) {
            if (tempMetar.length > Number(limit)) {
                for (let i = 0; i < Number(limit); i++) {
                    resultMetar.push(tempMetar[i]);
                }
            } else if (tempMetar.length < Number(limit)) {
                resultMetar = [...tempMetar];
            }
        } else {
            return resultMetar;
        }
    } catch (err) {
        throw new NotFoundError(`Cannot find weather for ${country.toUpperCase()}`);
    }

    res.status(200).json({
        status: "success",
        totalNumber: awcWeather.getNumberOfMetars(),
        result: resultMetar.length,
        data: {
            METAR: resultMetar,
        },
    });
};

module.exports.getWindMetarForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { limit = 10 } = req.query;
    let resultMetar = [];
    try {
        await awcWeather.getWeatherForCountry(country);
        const tempMetar = awcWeather.getWindMetarFromHighToLow();
        if (tempMetar.length > 0) {
            if (tempMetar.length > Number(limit)) {
                for (let i = 0; i < Number(limit); i++) {
                    resultMetar.push(tempMetar[i]);
                }
            } else if (tempMetar.length < Number(limit)) {
                resultMetar = [...tempMetar];
            }
        } else {
            return resultMetar;
        }
    } catch (err) {
        throw new NotFoundError(`Cannot find weather for ${country.toUpperCase()}`);
    }

    res.status(200).json({
        status: "success",
        totalNumber: awcWeather.getNumberOfMetars(),
        result: resultMetar.length,
        data: {
            METAR: resultMetar,
        },
    });
};

module.exports.getBaroMetarForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { sort = 1, limit = 10 } = req.query;
    let resultMetar = [];
    try {
        await awcWeather.getWeatherForCountry(country);

        if (Number(sort) === 1) {
            const tempMetar = awcWeather.getBaroMetarFromLowToHigh();
            if (tempMetar.length > 0) {
                if (tempMetar.length > Number(limit)) {
                    for (let i = 0; i < Number(limit); i++) {
                        resultMetar.push(tempMetar[i]);
                    }
                } else if (tempMetar.length < Number(limit)) {
                    resultMetar = [...tempMetar];
                }
            } else {
                return resultMetar;
            }
        }
        if (Number(sort) === -1) {
            const tempMetar = awcWeather.getBaroMetarFromHighToLow();
            if (tempMetar.length > 0) {
                if (tempMetar.length > Number(limit)) {
                    for (let i = 0; i < Number(limit); i++) {
                        resultMetar.push(tempMetar[i]);
                    }
                } else if (tempMetar.length < Number(limit)) {
                    resultMetar = [...tempMetar];
                }
            } else {
                return resultMetar;
            }
        }
    } catch (err) {
        throw new NotFoundError(`Cannot find weather for ${country.toUpperCase()}`);
    }

    res.status(200).json({
        status: "success",
        totalNumber: awcWeather.getNumberOfMetars(),
        result: resultMetar.length,
        data: {
            METAR: resultMetar,
        },
    });
};

module.exports.getVisibilityMetarForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { sort = 1, limit = 10 } = req.query;
    let resultMetar = [];
    try {
        await awcWeather.getWeatherForCountry(country);

        if (Number(sort) === 1) {
            const tempMetar = awcWeather.getVisibilityMetarFromLowToHigh();
            if (tempMetar.length > 0) {
                if (tempMetar.length > Number(limit)) {
                    for (let i = 0; i < Number(limit); i++) {
                        resultMetar.push(tempMetar[i]);
                    }
                } else if (tempMetar.length < Number(limit)) {
                    resultMetar = [...tempMetar];
                }
            } else {
                return resultMetar;
            }
        }
        if (Number(sort) === -1) {
            const tempMetar = awcWeather.getVisibilityMetarFromHighToLow();
            if (tempMetar.length > 0) {
                if (tempMetar.length > Number(limit)) {
                    for (let i = 0; i < Number(limit); i++) {
                        resultMetar.push(tempMetar[i]);
                    }
                } else if (tempMetar.length < Number(limit)) {
                    resultMetar = [...tempMetar];
                }
            } else {
                return resultMetar;
            }
        }
    } catch (err) {
        throw new NotFoundError(`Cannot find weather for ${country.toUpperCase()}`);
    }

    res.status(200).json({
        status: "success",
        totalNumber: awcWeather.getNumberOfMetars(),
        result: resultMetar.length,
        data: {
            METAR: resultMetar,
        },
    });
};

module.exports.getTempMetarForCountry = async (req, res, next) => {
    const { country } = req.params;
    const { sort = 1, limit = 10 } = req.query;
    let resultMetar = [];
    try {
        await awcWeather.getWeatherForCountry(country);

        if (Number(sort) === 1) {
            const tempMetar = awcWeather.getTempMetarFromLowToHigh();
            if (tempMetar.length > 0) {
                if (tempMetar.length > Number(limit)) {
                    for (let i = 0; i < Number(limit); i++) {
                        resultMetar.push(tempMetar[i]);
                    }
                } else if (tempMetar.length < Number(limit)) {
                    resultMetar = [...tempMetar];
                }
            } else {
                return resultMetar;
            }
        }
        if (Number(sort) === -1) {
            const tempMetar = awcWeather.getTempMetarFromHighToLow();
            if (tempMetar.length > 0) {
                if (tempMetar.length > Number(limit)) {
                    for (let i = 0; i < Number(limit); i++) {
                        resultMetar.push(tempMetar[i]);
                    }
                } else if (tempMetar.length < Number(limit)) {
                    resultMetar = [...tempMetar];
                }
            } else {
                return resultMetar;
            }
        }
    } catch (err) {
        throw new NotFoundError(`Cannot find weather for ${country.toUpperCase()}`);
    }

    res.status(200).json({
        status: "success",
        totalNumber: awcWeather.getNumberOfMetars(),
        result: resultMetar.length,
        data: {
            METAR: resultMetar,
        },
    });
};

//continent
module.exports.getMetarForContinent = async (req, res, next) => {
    const result = await awcWeather.getWeatherForContinent("SA");

    res.status(200).json({
        status: "success",
        result: result.length,
    });
};

module.exports.getWindGustForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { limit = 10 } = req.query;
    let resultMetar = [];
    try {
        await awcWeather.getWeatherForContinent(continent);
        const tempMetar = awcWeather.getGustMetarFromHighToLow();
        if (tempMetar.length > 0) {
            if (tempMetar.length > Number(limit)) {
                for (let i = 0; i < Number(limit); i++) {
                    resultMetar.push(tempMetar[i]);
                }
            } else if (tempMetar.length < Number(limit)) {
                resultMetar = [...tempMetar];
            }
        } else {
            return resultMetar;
        }
    } catch (err) {
        throw new NotFoundError(
            `Cannot find continent weather for continent/global code: ${continent.toUpperCase()}\n
             Please use code: AF, AN, AS, OC, EU, NA, SA
            `
        );
    }

    res.status(200).json({
        status: "success",
        totalNumber: awcWeather.getNumberOfMetars(),
        result: resultMetar.length,
        data: {
            METAR: resultMetar,
        },
    });
};

module.exports.getWindMetarForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { limit = 10 } = req.query;
    let resultMetar = [];
    try {
        await awcWeather.getWeatherForContinent(continent);
        const tempMetar = awcWeather.getWindMetarFromHighToLow();
        if (tempMetar.length > 0) {
            if (tempMetar.length > Number(limit)) {
                for (let i = 0; i < Number(limit); i++) {
                    resultMetar.push(tempMetar[i]);
                }
            } else if (tempMetar.length < Number(limit)) {
                resultMetar = [...tempMetar];
            }
        } else {
            return resultMetar;
        }
    } catch (err) {
        throw new NotFoundError(
            `Cannot find continent weather for continent/global code: ${continent.toUpperCase()}\n
             Please use code: AF, AN, AS, OC, EU, NA, SA
            `
        );
    }

    res.status(200).json({
        status: "success",
        totalNumber: awcWeather.getNumberOfMetars(),
        result: resultMetar.length,
        data: {
            METAR: resultMetar,
        },
    });
};

module.exports.getBaroMetarForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { sort = 1, limit = 10 } = req.query;
    let resultMetar = [];
    try {
        await awcWeather.getWeatherForContinent(continent);

        if (Number(sort) === 1) {
            const tempMetar = awcWeather.getBaroMetarFromLowToHigh();
            if (tempMetar.length > 0) {
                if (tempMetar.length > Number(limit)) {
                    for (let i = 0; i < Number(limit); i++) {
                        resultMetar.push(tempMetar[i]);
                    }
                } else if (tempMetar.length < Number(limit)) {
                    resultMetar = [...tempMetar];
                }
            } else {
                return resultMetar;
            }
        }
        if (Number(sort) === -1) {
            const tempMetar = awcWeather.getBaroMetarFromHighToLow();
            if (tempMetar.length > 0) {
                if (tempMetar.length > Number(limit)) {
                    for (let i = 0; i < Number(limit); i++) {
                        resultMetar.push(tempMetar[i]);
                    }
                } else if (tempMetar.length < Number(limit)) {
                    resultMetar = [...tempMetar];
                }
            } else {
                return resultMetar;
            }
        }
    } catch (err) {
        throw new NotFoundError(
            `Cannot find continent weather for continent/global code: ${continent.toUpperCase()}\n
             Please use code: AF, AN, AS, OC, EU, NA, SA
            `
        );
    }

    res.status(200).json({
        status: "success",
        totalNumber: awcWeather.getNumberOfMetars(),
        result: resultMetar.length,
        data: {
            METAR: resultMetar,
        },
    });
};

module.exports.getVisibilityMetarForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { sort = 1, limit = 10 } = req.query;
    let resultMetar = [];
    try {
        await awcWeather.getWeatherForContinent(continent);

        if (Number(sort) === 1) {
            const tempMetar = awcWeather.getVisibilityMetarFromLowToHigh();
            if (tempMetar.length > 0) {
                if (tempMetar.length > Number(limit)) {
                    for (let i = 0; i < Number(limit); i++) {
                        resultMetar.push(tempMetar[i]);
                    }
                } else if (tempMetar.length < Number(limit)) {
                    resultMetar = [...tempMetar];
                }
            } else {
                return resultMetar;
            }
        }
        if (Number(sort) === -1) {
            const tempMetar = awcWeather.getVisibilityMetarFromHighToLow();
            if (tempMetar.length > 0) {
                if (tempMetar.length > Number(limit)) {
                    for (let i = 0; i < Number(limit); i++) {
                        resultMetar.push(tempMetar[i]);
                    }
                } else if (tempMetar.length < Number(limit)) {
                    resultMetar = [...tempMetar];
                }
            } else {
                return resultMetar;
            }
        }
    } catch (err) {
        throw new NotFoundError(
            `Cannot find continent weather for continent/global code: ${continent.toUpperCase()}\n
             Please use code: AF, AN, AS, OC, EU, NA, SA
            `
        );
    }

    res.status(200).json({
        status: "success",
        totalNumber: awcWeather.getNumberOfMetars(),
        result: resultMetar.length,
        data: {
            METAR: resultMetar,
        },
    });
};

module.exports.getTempMetarForContinent = async (req, res, next) => {
    const { continent } = req.params;
    const { sort = 1, limit = 10 } = req.query;
    let resultMetar = [];
    try {
        await awcWeather.getWeatherForContinent(continent);

        if (Number(sort) === 1) {
            const tempMetar = awcWeather.getTempMetarFromLowToHigh();
            if (tempMetar.length > 0) {
                if (tempMetar.length > Number(limit)) {
                    for (let i = 0; i < Number(limit); i++) {
                        resultMetar.push(tempMetar[i]);
                    }
                } else if (tempMetar.length < Number(limit)) {
                    resultMetar = [...tempMetar];
                }
            } else {
                return resultMetar;
            }
        }
        if (Number(sort) === -1) {
            const tempMetar = awcWeather.getTempMetarFromHighToLow();
            if (tempMetar.length > 0) {
                if (tempMetar.length > Number(limit)) {
                    for (let i = 0; i < Number(limit); i++) {
                        resultMetar.push(tempMetar[i]);
                    }
                } else if (tempMetar.length < Number(limit)) {
                    resultMetar = [...tempMetar];
                }
            } else {
                return resultMetar;
            }
        }
    } catch (err) {
        throw new NotFoundError(
            `Cannot find continent weather for continent/global code: ${continent.toUpperCase()}\n
             Please use code: AF, AN, AS, OC, EU, NA, SA
            `
        );
    }

    res.status(200).json({
        status: "success",
        totalNumber: awcWeather.getNumberOfMetars(),
        result: resultMetar.length,
        data: {
            METAR: resultMetar,
        },
    });
};

module.exports.getWindGustForGlobal = async (req, res, next) => {
    const { limit = 10 } = req.query;
    let resultMetar = [];
    try {
        await awcWeather.getWeatherForGlobal();
        const tempMetar = awcWeather.getGustMetarFromHighToLow();
        if (tempMetar.length > 0) {
            if (tempMetar.length > Number(limit)) {
                for (let i = 0; i < Number(limit); i++) {
                    resultMetar.push(tempMetar[i]);
                }
            } else if (tempMetar.length < Number(limit)) {
                resultMetar = [...tempMetar];
            }
        } else {
            return resultMetar;
        }
    } catch (err) {
        throw new NotFoundError(`Cannot find global weather`);
    }

    res.status(200).json({
        status: "success",
        totalNumber: awcWeather.getNumberOfMetars(),
        result: resultMetar.length,
        data: {
            METAR: resultMetar,
        },
    });
};

module.exports.getWindMetarForGlobal = async (req, res, next) => {
    const { limit = 10 } = req.query;
    let resultMetar = [];
    try {
        await awcWeather.getWeatherForGlobal();
        const tempMetar = awcWeather.getWindMetarFromHighToLow();
        if (tempMetar.length > 0) {
            if (tempMetar.length > Number(limit)) {
                for (let i = 0; i < Number(limit); i++) {
                    resultMetar.push(tempMetar[i]);
                }
            } else if (tempMetar.length < Number(limit)) {
                resultMetar = [...tempMetar];
            }
        } else {
            return resultMetar;
        }
    } catch (err) {
        throw new NotFoundError(`Cannot find global weather`);
    }

    res.status(200).json({
        status: "success",
        totalNumber: awcWeather.getNumberOfMetars(),
        result: resultMetar.length,
        data: {
            METAR: resultMetar,
        },
    });
};

module.exports.getBaroMetarForGlobal = async (req, res, next) => {
    const { sort = 1, limit = 10 } = req.query;
    let resultMetar = [];
    try {
        await awcWeather.getWeatherForGlobal();

        if (Number(sort) === 1) {
            const tempMetar = awcWeather.getBaroMetarFromLowToHigh();
            if (tempMetar.length > 0) {
                if (tempMetar.length > Number(limit)) {
                    for (let i = 0; i < Number(limit); i++) {
                        resultMetar.push(tempMetar[i]);
                    }
                } else if (tempMetar.length < Number(limit)) {
                    resultMetar = [...tempMetar];
                }
            } else {
                return resultMetar;
            }
        }
        if (Number(sort) === -1) {
            const tempMetar = awcWeather.getBaroMetarFromHighToLow();
            if (tempMetar.length > 0) {
                if (tempMetar.length > Number(limit)) {
                    for (let i = 0; i < Number(limit); i++) {
                        resultMetar.push(tempMetar[i]);
                    }
                } else if (tempMetar.length < Number(limit)) {
                    resultMetar = [...tempMetar];
                }
            } else {
                return resultMetar;
            }
        }
    } catch (err) {
        throw new NotFoundError("Cannot find global weather");
    }

    res.status(200).json({
        status: "success",
        totalNumber: awcWeather.getNumberOfMetars(),
        result: resultMetar.length,
        data: {
            METAR: resultMetar,
        },
    });
};

module.exports.getVisibilityMetarForGlobal = async (req, res, next) => {
    const { sort = 1, limit = 10 } = req.query;
    let resultMetar = [];
    try {
        await awcWeather.getWeatherForGlobal();

        if (Number(sort) === 1) {
            const tempMetar = awcWeather.getVisibilityMetarFromLowToHigh();
            if (tempMetar.length > 0) {
                if (tempMetar.length > Number(limit)) {
                    for (let i = 0; i < Number(limit); i++) {
                        resultMetar.push(tempMetar[i]);
                    }
                } else if (tempMetar.length < Number(limit)) {
                    resultMetar = [...tempMetar];
                }
            } else {
                return resultMetar;
            }
        }
        if (Number(sort) === -1) {
            const tempMetar = awcWeather.getVisibilityMetarFromHighToLow();
            if (tempMetar.length > 0) {
                if (tempMetar.length > Number(limit)) {
                    for (let i = 0; i < Number(limit); i++) {
                        resultMetar.push(tempMetar[i]);
                    }
                } else if (tempMetar.length < Number(limit)) {
                    resultMetar = [...tempMetar];
                }
            } else {
                return resultMetar;
            }
        }
    } catch (err) {
        throw new NotFoundError("Cannot find global weather");
    }

    res.status(200).json({
        status: "success",
        totalNumber: awcWeather.getNumberOfMetars(),
        result: resultMetar.length,
        data: {
            METAR: resultMetar,
        },
    });
};

module.exports.getTempMetarForGlobal = async (req, res, next) => {
    const { sort = 1, limit = 10 } = req.query;
    let resultMetar = [];
    try {
        await awcWeather.getWeatherForGlobal();

        if (Number(sort) === 1) {
            const tempMetar = awcWeather.getTempMetarFromLowToHigh();
            if (tempMetar.length > 0) {
                if (tempMetar.length > Number(limit)) {
                    for (let i = 0; i < Number(limit); i++) {
                        resultMetar.push(tempMetar[i]);
                    }
                } else if (tempMetar.length < Number(limit)) {
                    resultMetar = [...tempMetar];
                }
            } else {
                return resultMetar;
            }
        }
        if (Number(sort) === -1) {
            const tempMetar = awcWeather.getTempMetarFromHighToLow();
            if (tempMetar.length > 0) {
                if (tempMetar.length > Number(limit)) {
                    for (let i = 0; i < Number(limit); i++) {
                        resultMetar.push(tempMetar[i]);
                    }
                } else if (tempMetar.length < Number(limit)) {
                    resultMetar = [...tempMetar];
                }
            } else {
                return resultMetar;
            }
        }
    } catch (err) {
        throw new NotFoundError("Cannot find global weather");
    }

    res.status(200).json({
        status: "success",
        totalNumber: awcWeather.getNumberOfMetars(),
        result: resultMetar.length,
        data: {
            METAR: resultMetar,
        },
    });
};
