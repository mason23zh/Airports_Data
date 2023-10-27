module.exports.tafForecastType = [
    {
        code: "FM",
        name: "FROM",
        description: "Standard forecast or significant change"
    },
    {
        code: "TEMPO",
        name: "TEMPORARY",
        description: "The following changes expected for less than half the time period"
    },
    {
        code: "BECMG",
        name: "BECOMING",
        description: "Changes expected for the time period"
    }
];

module.exports.metarCloudCode = [
    {
        code: "FEW",
        name: "few",
        density: "1/8 - 2/8"
    },
    {
        code: "SCT",
        name: "scattered",
        density: "3/8 - 4/8"
    },
    {
        code: "BKN",
        name: "broken",
        density: "5/8 – 7/8"
    },
    {
        code: "OVC",
        name: "overcast",
        density: "8/8"
    },
    {
        code: "CB",
        name: "Cumulonimbus cloud"
    },
    {
        code: "TCU",
        name: "towering cumulus"
    },
    {
        code: "VV",
        name: "vertical visibility",
        density: "8/8"
    }
];

module.exports.metarWeatherCode = {
    "-": "light intensity",
    "+": "heavy intensity",
    VC: "in the vicinity",
    MI: "shallow",
    PR: "partial",
    BC: "patches",
    DR: "low drifting",
    BL: "blowing",
    SH: "showers",
    TS: "thunderstorm",
    FZ: "freezing",
    RA: "rain",
    DZ: "drizzle",
    SN: "snow",
    SG: "snow grains",
    IC: "ice crystals",
    PL: "ice pellets",
    GR: "hail",
    GS: "small hail",
    UP: "unknown precipitation",
    FG: "fog",
    VA: "volcanic ash",
    BR: "mist",
    HZ: "haze",
    DU: "widespread dust",
    FU: "smoke",
    SA: "sand",
    PY: "spray",
    SQ: "squall",
    PO: "dust or sand whirls",
    DS: "duststorm",
    SS: "sandstorm",
    FC: "funnel cloud",
    RE: "recent"
};
