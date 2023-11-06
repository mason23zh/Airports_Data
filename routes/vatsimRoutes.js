const express = require("express");
const router = express.Router();
const {
    getVatsimEvents,
    sortVatsimEventsByTime,
    getCurrentVatsimEvents,
    importToDB
} = require("../controllers/Vatsim/vatsimControllers");

router.get("/getEvents", getVatsimEvents);
router.get("/getSortedEventsByDate", sortVatsimEventsByTime);
router.get("/getCurrentEvents", getCurrentVatsimEvents);
router.get("/test", importToDB);
module.exports = router;
