const fs = require("fs");

const airportsJSON = fs.readFileSync("large_airportInEU.json");
const airports = JSON.parse(airportsJSON);

const airportArray = [];
airports.forEach((airport) => {
    const aircraftTypes =
        "Boeing 738, AIRBUS A319, McDonnell Douglas MD-11,Bombardier Challenger 650,AIRBUS A340-600, AIRBUS A320, AIRBUS A320 Neo,AIRBUS A321,BOEING B787,Boeing 737 MAX";
    const aiprortTypeArray = [
        "Boeing 738",
        "AIRBUS A319",
        "McDonnell Douglas MD-11",
        "Bombardier Challenger 650",
        "AIRBUS A340-600",
        "AIRBUS A320",
        "AIRBUS A320 Neo",
        "AIRBUS A321",
        "BOEING B787",
        "Boeing 737 MAX",
    ];
    const airportCSVFormat = {};
    airportCSVFormat.id = "";
    airportCSVFormat.name = airport.name;
    airportCSVFormat.icao = airport.ident;
    airportCSVFormat.iata = airport.iata_code;
    airportCSVFormat.base = "FALSE";
    airportCSVFormat.handler = "";
    airportCSVFormat.taxi_in_minutes = "";
    airportCSVFormat.taxi_out_minutes = "";
    airportCSVFormat.callsign_parameters = "DKH,N";
    airportCSVFormat.aircraft_types = aircraftTypes;
    airportCSVFormat.load_factor = "";
    airportCSVFormat.containers = "";
    airportCSVFormat.delete = "no";
    airportArray.push(airportCSVFormat);
});

const airportJSON = JSON.stringify(airportArray);

fs.writeFileSync("targetAirport.json", airportJSON);
