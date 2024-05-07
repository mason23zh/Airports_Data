const fs = require("fs");
const readline = require("readline");
const logger = require("../../logger/index");

function processLineByLine1() {
    let airportsCount = 0;
    const airports = [];
    let airportObj = {};
    let runwayObj = {};
    let runwayArray = [];

    const fileStream = fs.createReadStream("../../dev-data/GNS430_Data/Airports.txt");
    //const fileStream = fs.createReadStream("H:/node-js-project/Flight-Data/dev-data/GNS430_Data/Airports_test.txt");

    const rl = readline.createInterface({
        input: fileStream
        /**removeHistoryDuplicates: true,**/
    });

    rl.on("line", (line) => {
        if (line.length > 0 && (line.startsWith("A") || line.startsWith("R"))) {
            if (line.startsWith("A")) {
                const airportLatitude = Number(line.split(",")[3]);
                const airportLongitude = Number(line.split(",")[4]);

                airportObj.ICAO = line.split(",")[1];
                airportObj.name = line.split(",")[2];

                const tempObject = {
                    type: "Point",
                    coordinates: [airportLongitude, airportLatitude]
                };
                airportObj = { ...airportObj, location: tempObject };

                airportObj.elevation = Number(line.split(",")[5]);
                airportObj.transitionAltitude = Number(line.split(",")[6]);
            } else if (line.startsWith("R")) {
                const runwayThrLatitude = Number(line.split(",")[8]);
                const runwayThrLongitude = Number(line.split(",")[9]);

                runwayObj.runway_id = line.split(",")[1];
                runwayObj.runwayHdg = Number(line.split(",")[2]);
                runwayObj.runwayLength = Number(line.split(",")[3]);
                runwayObj.runwayWidth = Number(line.split(",")[4]);
                runwayObj.runway_ils_avl = Number(line.split(",")[5]);
                runwayObj.ilsFreq = Number(line.split(",")[6]);
                runwayObj.ilsHdg = Number(line.split(",")[7]);
                //runwayObj.coordinates = [runwayThrLongitude, runwayThrLatitude];
                const tempRunwayLocation = {
                    type: "Point",
                    coordinates: [runwayThrLongitude, runwayThrLatitude]
                };
                runwayObj = { ...runwayObj, runwayLocation: tempRunwayLocation };
                //runwayObj.thresholdLatitude = Number(line.split(",")[8]);
                //runwayObj.thresholdLongitude = Number(line.split(",")[9]);
                runwayObj.thresholdElevation = Number(line.split(",")[10]);
                runwayObj.gsAngle = Number(line.split(",")[11]);
                runwayObj.thresholdOverflyAlt = Number(line.split(",")[12]);
                runwayObj.surfaceType = Number(line.split(",")[13]);
                runwayObj.runwayStatus = Number(line.split(",")[14]);
                runwayArray.push(runwayObj);
                runwayObj = {};
            }
        } else {
            airportObj.runways = runwayArray;
            runwayArray = [];
            airports.push(airportObj);
            airportObj = {};
            // eslint-disable-next-line no-plusplus
            logger.info(`added ${airportsCount++}`);
            fs.writeFileSync(
                "../../dev-data/GNS430_Data/Airports_2303.json",
                JSON.stringify(airports)
            );
        }
    });
}

processLineByLine1();
