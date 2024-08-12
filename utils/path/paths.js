const path = require("path");
const rootDir = path.resolve(__dirname, "../../");

module.exports = {
    gns430AirportsWithLocation: path.join(
        rootDir,
        "dev-data/GNS430_Data/GNS430_airports_with_location.json"
    )
};
