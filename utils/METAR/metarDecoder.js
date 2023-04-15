const metarDecoder = (metar) => {
    const decodedMetar = {
        rawMetar: "",
        decoded: {
            name: "",
            icao: "",
            flight_category: "",
            observed: "",
            clouds: [],
            conditions: [],
            wind: {},
            temperature: {},
            visibility: {},
        },
    };

    if (!metar) {
        return;
    }

    decodedMetar.rawMetar = metar.raw_text;
    decodedMetar.decoded.icao = metar.icao;
    decodedMetar.decoded.observed = metar.observed;
    decodedMetar.decoded.name = metar.station.name;
    //Barometer
    decodedMetar.decoded.baroIng = metar.barometer ? metar.barometer.hg : "Not Available";
    decodedMetar.decoded.baroQNH = metar.barometer ? metar.barometer.mb : "Not Available";
    //wind
    decodedMetar.decoded.wind.windSpeed = metar.wind ? metar.wind.speed_kts : 0;
    decodedMetar.decoded.wind.windDirection = metar.wind ? metar.wind.degrees : 0;
    decodedMetar.decoded.wind.windGust = metar.wind ? metar.wind.gust_kts : 0;
    //cloud
    if (metar.clouds.length > 0 && (metar.clouds[0].code === "CAVOK" || metar.clouds[0].code === "SKC")) {
        decodedMetar.decoded.clouds.push(metar.clouds[0].text);
    } else {
        metar.clouds.forEach((cloud) => {
            const clouds = `${cloud.text}(${cloud.code}) ${cloud.feet} AGL`;
            decodedMetar.decoded.clouds.push(clouds);
        });
        const clouds = metar.clouds[0]
            ? `${metar.clouds[0].text}(${metar.clouds[0].code}) ${metar.clouds[0].feet} AGL`
            : "";
        decodedMetar.decoded.clouds.push(clouds);
    }
    //temperature

    if (metar.temperature && metar.temperature.minimum) {
        decodedMetar.decoded.temperature.temperature = metar.temperature.minimum.celsius;
    } else if (metar.temperature) {
        decodedMetar.decoded.temperature.temperature = metar.temperature.celsius;
    } else {
        decodedMetar.decoded.temperature.temperature = "";
    }
    decodedMetar.decoded.temperature.dewpoint = metar.dewpoint ? metar.dewpoint.celsius : "Not Available";
    //condition
    if (metar.conditions) {
        metar.conditions.forEach((condition) => {
            const conditions = `${condition.code}: ${condition.text}`;
            decodedMetar.decoded.conditions.push(conditions);
        });
    }
    //visibility
    decodedMetar.decoded.visibility.mile = metar.visibility ? metar.visibility.miles : "";
    decodedMetar.decoded.visibility.meter = metar.visibility ? metar.visibility.meters : "";
    //flight_category
    decodedMetar.decoded.flight_category = metar.flight_category ? metar.flight_category : "";
    return decodedMetar;
};

module.exports.metarDecoder = metarDecoder;
