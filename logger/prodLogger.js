const { createLogger, format, transports } = require("winston");
const path = require("path");

const logFormat = format.printf(
    (info) => `${info.timestamp} [${info.level}] [${info.label}]: ${info.message}`
);

const prodLogger = () => {
    return createLogger({
        level: "debug",
        format: format.combine(
            format.label({ label: path.basename(process.mainModule.filename) }),
            format.timestamp(),
            // Format the metadata object
            format.metadata({ fillExcept: ["message", "level", "timestamp", "label"] }),
            format.splat()
        ),
        transports: [
            new transports.Console({
                format: format.combine(logFormat)
            })
        ]
    });
};

module.exports = prodLogger;
