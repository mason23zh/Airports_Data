const { createLogger, format, transports } = require("winston");
const path = require("path");

const logFormat = format.printf(
    (info) => `${info.timestamp} [${info.level}] [${info.label}]: ${info.message}`
);

const devLogger = () => {
    return createLogger({
        level: "debug",
        //format: combine(colorize(), timestamp({ format: "HH:mm:ss" }), prettyPrint()),
        format: format.combine(
            format.label({ label: path.basename(process.mainModule.filename) }),
            format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            // Format the metadata object
            format.metadata({ fillExcept: ["message", "level", "timestamp", "label"] }),
            format.splat()
        ),
        transports: [
            new transports.Console({
                format: format.combine(format.colorize(), logFormat)
            })
        ]
    });
};

module.exports = devLogger;
