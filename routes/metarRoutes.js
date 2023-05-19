const express = require("express");
const { getMetar } = require("../controllers/METAR/metarControllers");
const router = express.Router();

router.route("/get-metar").get(getMetar);

module.exports = router;
