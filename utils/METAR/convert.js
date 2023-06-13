/**
 * convert knots per second to meter per second
 * */
module.exports.ktsToMps = (kt) => {
    return (Number(kt) * 0.51444).toFixed();
};

/**
 * convert knots per second to kilometer per hour
 * */
module.exports.ktsTokph = (kt) => {
    return (Number(kt) * 1.852).toFixed();
};

/**
 * convert knots per second to mile per hour
 * */
module.exports.ktsToMph = (kt) => {
    return (Number(kt) * 1.15078).toFixed();
};

module.exports.statuteMiToMeter = (sm) => {
    return (Number(sm) * 1609.34).toFixed();
};

module.exports.celsiusToFahrenheit = (celsius) => {
    return (Number(celsius) * (9 / 5) + 32).toFixed();
};

module.exports.meterToFeet = (meter) => {
    return (Number(meter) * 3.28084).toFixed();
};

module.exports.calculateHumidity = (temperature, dewpoint) => {
    const temp = Number(temperature);
    const dew = Number(dewpoint);
    const m = (temp >= -20 && temp) <= 50 ? 7.591386 : 9.778707;
    const Tn = (temp >= -20 && temp) <= 50 ? 240.7263 : 273.1466;
    const exp = m * (dew / (dew + Tn) - temp / (temp + Tn));
    const humidity = 100 * 10 ** exp;
    return humidity.toFixed();
};

module.exports.distanceConverter = (distanceUnit, distance) => {
    let newDistance;
    switch (distanceUnit.toLowerCase()) {
        case "mi":
            newDistance = Number(distance);
            break;
        case "mile":
            newDistance = Number(distance);
            break;
        case "miles":
            newDistance = Number(distance);
            break;
        case "km":
            newDistance = Number(distance) * 0.621371;
            break;
        case "kilometers":
            newDistance = Number(distance) * 0.621371;
            break;
        case "kilometer":
            newDistance = Number(distance) * 0.621371;
            break;
        case "nm":
            newDistance = Number(distance) * 1.15078;
            break;
        case "nauticalmile":
            newDistance = Number(distance) * 1.15078;
            break;
        case "nauticalmiles":
            newDistance = Number(distance) * 1.15078;
            break;
        default:
            newDistance = Number(distance);
    }
    return newDistance;
};
