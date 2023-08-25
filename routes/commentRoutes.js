const express = require("express");
const {
    getAllComments,
    createComment,
    setCommentUserId,
    deleteComment,
    updateComment
} = require("../controllers/Comments/commentControllers");
const { protect, restrictTo } = require("../controllers/authControllers");

//for nested route from the airport routes
// post /airports/123asdf/comments
const router = express.Router({ mergeParams: true });

router.route("/").get(getAllComments).post(protect, setCommentUserId, createComment);

router.route("/:id").delete(protect, deleteComment).patch(protect, updateComment);

module.exports = router;
