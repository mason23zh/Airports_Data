const path = require("path");
const rootDir =
    process.env.NODE_ENV === "development"
        ? path.resolve(__dirname, "../../")
        : path.resolve("/app");

module.exports = {
    gns430AirportsWithLocation: path.join(
        rootDir,
        "utils/AWC_Weather/Data/GNS430_airports_with_location.json"
    )
};
