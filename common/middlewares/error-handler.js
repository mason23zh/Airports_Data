const CustomError = require("../errors/custom-error");
const BadRequestError = require("../errors/BadRequestError");
const ValidationError = require("../errors/ValidationError");
const UnAuthorizedError = require("../errors/UnAuthorizedError");
const logger = require("../../logger/index");

const handleCastErrorDB = (err) => new BadRequestError(`Invalid ${err.path}: ${err.value}`);

const handleDuplicateFieldsDB = (err) =>
    new BadRequestError(`Duplicate field value: ${Object.values(err.keyValue)}`);

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((error) => error.message);
    return new ValidationError(errors);
};

const handleJWTError = () => new UnAuthorizedError(`Invalid Token, Please Login Again`);

const handleTokenExpiredError = () => new UnAuthorizedError(`Token expired, Please Login Again`);

const handleCheckWxApiError = () => new BadRequestError("Check Wx API Error");

/**
 *
 * @param err Error object
 * @param res Response
 * @returns json object
 * This method will only be used in the development
 * which include error detail such as stacktrace.
 */
const sendErrorDev = (err, res) => {
    logger.info("dev error");
    if (err instanceof CustomError) {
        return res.status(err.statusCode).json({
            error: {
                message: err.message,
                statusCode: err.statusCode,
                status: err.status,
                stack: err.stack
            }
        });
    }
    res.status(400).json({
        error: {
            message: "General Error",
            statusCode: 400,
            status: "fail",
            stack: err.stack
        }
    });
};

/**
 *
 * @param err Error Object
 * @param res Response
 * @returns json object
 * This method will be used in the production.
 * If error is operational error, then the corresponding error will be
 * sent.
 * If error is programming error, a generic 500 error will be sent
 */
const sendErrorProd = (err, res) => {
    //Operational Error
    logger.info("prod error:%O", err);
    if (err instanceof CustomError) {
        return res.status(err.statusCode).json({
            error: {
                message: err.message,
                statusCode: err.statusCode,
                status: err.status
            }
        });
    }
    // Programming Error
    res.status(500).json({
        err: {
            message: "500 Error. Something went very wrong",
            statusCode: 500,
            status: "error"
        }
    });
};

const errorHandler = (err, req, res, next) => {
    if (process.env.NODE_ENV === "development") {
        logger.error("ERROR from errorHandler development:%O", err);
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === "production") {
        let error = Object.create(err);

        logger.error("ERROR from errorhandler production:%O", error);

        //Convert a CastError into an operational BadRequestError
        if (error.name === "CastError") {
            error = handleCastErrorDB(error);
        }

        //Convert 11000 DB error into an operational BadRequestError
        if (error.code === 11000) {
            console.log("Duplicated Fileds");
            error = handleDuplicateFieldsDB(error);
        }

        //Mongo Validation Error
        if (error.name === "ValidationError") {
            error = handleValidationErrorDB(error);
        }

        //JWT error
        if (error.name === "JsonWebTokenError") {
            error = handleJWTError();
        }

        //Token Expired Error
        if (error.name === "TokenExpiredError") {
            error = handleTokenExpiredError();
        }

        //wxapi error
        if (error.message.code === "ENOTFOUND") {
            error = handleCheckWxApiError();
        }

        sendErrorProd(error, res);
    }
};

module.exports = errorHandler;
