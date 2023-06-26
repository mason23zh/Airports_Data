const express = require("express");
const {
    signup,
    login,
    protect,
    restrictTo,
    updatePassword
} = require("../controllers/authControllers");
const {
    getAllUsers,
    updateUser,
    deleteUser,
    getOneUser
} = require("../controllers/userControllers");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.patch("/updateMe", protect, updateUser);
router.delete("/deleteMe", protect, deleteUser);

router.post("/updatePassword", protect, updatePassword);

router.get("/getAllUsers", protect, restrictTo("admin"), getAllUsers);

router.get("/getOneUser/:id", getOneUser);

module.exports = router;
