const { ICAO_COUNTRY_CODE } = require("./gloabalICAOCountryCode");
module.exports.checkICAO = (input) => {
    const tempIcao = input.toUpperCase();
    if (tempIcao.length !== 3 && tempIcao.length !== 4) {
        return false;
    }
    return ICAO_COUNTRY_CODE.includes(tempIcao.slice(0, 2));
};
