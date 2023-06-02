const convert = require("../../../utils/METAR/convert");
describe("Speed convert", () => {
    describe("ktsToMps", () => {
        it("Should convert kts to mps and return the result as string", () => {
            const kt = 10;
            const expected = (kt * 0.51444).toFixed();
            const actual = convert.ktsToMps(kt);

            expect(actual).toEqual(expected);
            expect(typeof actual).toBe("string");
            expect(typeof Number(actual)).toBe("number");
        });
    });

    describe("ktsTokph", () => {
        it("Should convert kts to kph and return the result as string", () => {
            const kt = 10;
            const expected = (kt * 1.852).toFixed();
            const actual = convert.ktsTokph(kt);

            expect(actual).toEqual(expected);
            expect(typeof actual).toBe("string");
            expect(typeof Number(actual)).toBe("number");
        });
    });

    describe("ktsToMph", () => {
        it("Should covert kts to mph and return the result as string", () => {
            const kt = 10;
            const expected = (kt * 1.15078).toFixed();
            const actual = convert.ktsToMph(kt);

            expect(actual).toEqual(expected);
            expect(typeof actual).toBe("string");
            expect(typeof Number(actual)).toBe("number");
        });
    });
});

describe("length convert", () => {
    describe("statuteMiToMetar", () => {
        it("Should convert statute mile to metar and return the result as string", () => {
            const sm = 13;
            const expected = (sm * 1609.34).toFixed();
            const actual = convert.statuteMiToMeter(sm);

            expect(actual).toEqual(expected);
            expect(typeof actual).toBe("string");
            expect(typeof Number(actual)).toBe("number");
        });
    });

    describe("metarToFeet", () => {
        it("Should convert meter to feet and return the result as string", () => {
            const metar = 15;
            const expected = (metar * 3.28084).toFixed();
            const actual = convert.meterToFeet(metar);

            expect(actual).toEqual(expected);
            expect(typeof actual).toBe("string");
            expect(typeof Number(actual)).toBe("number");
        });
    });

    describe("distanceConverter", () => {
        it("Should return un-changed distance if unit is mile", () => {
            const unit = "mi";
            const distance = 15;
            const expected = 15;
            const actual = convert.distanceConverter(unit, distance);
            expect(actual).toEqual(expected);
        });
        it("should convert km to mile if km is the distance unit", () => {
            const unit = "km";
            const distance = 10;
            const expected = Number(distance * 0.621371);
            const actual = convert.distanceConverter(unit, distance);
            expect(actual).toEqual(expected);
        });
        it("should convert nm to mile if nm is the distance unit", () => {
            const unit = "nm";
            const distance = 10;
            const expected = Number(distance * 1.15078);
            const actual = convert.distanceConverter(unit, distance);
            expect(actual).toEqual(expected);
        });
    });
});

describe("Temperature convert", () => {
    describe("celsiusToFahrenheit", () => {
        it("Should convert the Celsius to Fahrenheit and return as the string", () => {
            const celsius = 32;
            const expected = (celsius * (9 / 5) + 32).toFixed();
            const actual = convert.celsiusToFahrenheit(celsius);

            expect(actual).toEqual(expected);
            expect(typeof actual).toBe("string");
            expect(typeof Number(actual)).toBe("number");
        });
    });

    describe("calculateHumidity", () => {
        it("Should calculate the humidity and return the result as the string", () => {
            const calHumidity = (temperature, dewpoint) => {
                const temp = Number(temperature);
                const dew = Number(dewpoint);
                const m = (temp >= -20 && temp) <= 50 ? 7.591386 : 9.778707;
                const Tn = (temp >= -20 && temp) <= 50 ? 240.7263 : 273.1466;
                const exp = m * (dew / (dew + Tn) - temp / (temp + Tn));
                return (100 * 10 ** exp).toFixed();
            };
            expect(convert.calculateHumidity(30, 20)).toEqual(calHumidity(30, 20));
            expect(convert.calculateHumidity(-30, -15)).toEqual(calHumidity(-30, -15));
            expect(typeof convert.calculateHumidity(23, 30)).toBe("string");
        });
    });
});
