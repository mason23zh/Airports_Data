const CHECK_WEATHER_BASE_URL = "https://api.checkwx.com";
const FAA_ATIS_API_BASE_URL = "https://datis.clowd.io/api";
const VATSIM_DATA_URL = "https://data.vatsim.net/v3/vatsim-data.json";
const VATSIM_EVENTS_URL = "https://my.vatsim.net/api/v1/events/all";
const AWC_METAR_BASE_URL =
    "https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml";
const PORT = 8000;

module.exports = {
    AWC_METAR_BASE_URL,
    CHECK_WEATHER_BASE_URL,
    FAA_ATIS_API_BASE_URL,
    VATSIM_DATA_URL,
    VATSIM_EVENTS_URL,
    PORT
};
