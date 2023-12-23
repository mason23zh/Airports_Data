const devLogger = require("./devLogger");
const prodLogger = require("./prodLogger");
let logger = null;

if (process.env.NODE_ENV !== "production") {
    logger = devLogger();
}

if (process.env.NODE_ENV === "production") {
    logger = prodLogger();
}

module.exports = logger;
