const fs = require("fs");
const logger = require("../../logger/index");
const readline = require("readline");

/**
 * "id","ident","type","name","latitude_deg","longitude_deg","elevation_ft","continent","iso_country","iso_region","municipality","scheduled_service","gps_code","iata_code","local_code","home_link","wikipedia_link","keywords"
 6523,"00A","heliport","Total Rf Heliport",40.07080078125,-74.93360137939453,11,"NA","US","US-PA","Bensalem","no","00A",,"00A",,,
 */

const processLineByLine = async () => {
    const airportArrays = [];

    const fileStream = await fs.createReadStream("../dev-data/csv_data/airports.csv");

    const rl = await readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const airportObj = {};
    rl.on("line", (line) => {
        const airportStringArray = line.split(",");
        airportObj._id = airportStringArray[0];
        airportObj.ident = airportStringArray[1].replace(/["']/g, "");
        airportObj.type = airportStringArray[2].replace(/["']/g, "");
        airportObj.name = airportStringArray[3].replace(/["']/g, "");
        airportObj.coordinates = [airportStringArray[4], airportStringArray[5]];
        airportObj.elevationFt = airportStringArray[6];
        airportObj.continent = airportStringArray[7].replace(/["']/g, "");
        airportObj.iso_country = airportStringArray[8].replace(/["']/g, "");
        airportObj.iso_region = airportStringArray[9].replace(/["']/g, "");
        airportObj.municipality = airportStringArray[10].replace(/["']/g, "");
        airportObj.scheduled_service = airportStringArray[11].replace(/["']/g, "");
        airportObj.gps_code = airportStringArray[12].replace(/["']/g, "");
        airportObj.iata_code = airportStringArray[13].replace(/["']/g, "");
        airportObj.local_code = airportStringArray[14].replace(/["']/g, "");
        airportObj.home_link = airportStringArray[15].replace(/["']/g, "");
        airportObj.wikipedia_link = airportStringArray[16].replace(/["']/g, "");
        airportObj.keywords = airportStringArray[17].replace(/["']/g, "").split(",");

        airportArrays.push(airportObj);

        fs.writeFileSync("../dev-data/json_data/airports.json", JSON.stringify(airportArrays));
        logger.info("writing...");
    });
};

processLineByLine();
