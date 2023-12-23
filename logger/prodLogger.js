const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf } = format;

const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp}  [${level}]: ${message}`;
});
const prodLogger = () => {
    return createLogger({
        level: "info",
        format: combine(timestamp(), myFormat),
        transports: [new transports.Console()]
    });
};

module.exports = prodLogger;
