const express = require("express");

require("express-async-errors");
const morgan = require("morgan");
const compression = require("compression");
const helmet = require("helmet");
const xss = require("xss-clean");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const airportsRoutes = require("./routes/airportsRoutes");
const userRoutes = require("./routes/userRoutes");
const commentRoutes = require("./routes/commentRoutes");
const weatherRoutes = require("./routes/weatherRoutes");
const metarRoutes = require("./routes/metarRoutes");
const errorHandler = require("./common/middlewares/error-handler");
const NotFoundError = require("./common/errors/NotFoundError");
const AccessNumberExceedError = require("./common/errors/AccessNumberExceedError");
const app = express();

app.use(require("express-status-monitor")());

app.use(compression());

app.use(helmet());

console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

//request rate limiter
//Allows 100 request from the same IP in 1 hour interval
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Request number exceeded, try again in an hour.",
    handler: function () {
        throw new AccessNumberExceedError("Request number exceeded, try in an hour.");
    },
});
// app.use("/api", limiter);

app.use(express.json({ limit: "10kb" }));

app.use(mongoSanitize());

app.use(xss());

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use(cors());

app.use("/api/v1/airports", airportsRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/weather", weatherRoutes);
app.use("/api/v1/metar", metarRoutes);

app.all("*", (req, res) => {
    throw new NotFoundError("Page Not Found");
});

app.use(errorHandler);

module.exports = app;
