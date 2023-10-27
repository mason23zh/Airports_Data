const express = require("express");
const router = express.Router();
const { getVatsimEvents } = require("../controllers/Vatsim/vatsimControllers");

router.get("/getEvents", getVatsimEvents);

module.exports = router;
