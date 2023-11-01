const express = require("express");
const router = express.Router();
const {
    getVatsimEvents,
    sortVatsimEventsByTime
} = require("../controllers/Vatsim/vatsimControllers");

router.get("/getEvents", getVatsimEvents);
router.get("/getSortedEventsByDate", sortVatsimEventsByTime);

module.exports = router;
