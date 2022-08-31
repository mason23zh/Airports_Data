const fs = require("fs");
const readline = require("readline");
//const airportData = fs.readFileSync("../dev-data/airports.dat", "utf-8");

/**
 * "id","ident","type","name","latitude_deg","longitude_deg","elevation_ft","continent","iso_country","iso_region","municipality","scheduled_service","gps_code","iata_code","local_code","home_link","wikipedia_link","keywords"
6523,"00A","heliport","Total Rf Heliport",40.07080078125,-74.93360137939453,11,"NA","US","US-PA","Bensalem","no","00A",,"00A",,,
 */

const processLineByLine = async () => {
  const fileStream = await fs.createReadStream(
    "../dev-data/csv_data/airports.csv"
  );

  const rl = await readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const airportObj = {};
  rl.on("line", (line) => {
    const airportStringArray = line.split(",");
    console.log(airportStringArray);
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
    console.log(airportObj);
  });
};

processLineByLine();
