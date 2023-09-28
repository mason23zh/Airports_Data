const express = require("express");
const { checkAnswer } = require("../controllers/puzzlesControllers");

const router = express.Router();

router.route("/check-answer").post(checkAnswer);

module.exports = router;
