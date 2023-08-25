const Comment = require("../../models/airport_comment/commentModel");
const factory = require("../factoryController");
const NotFoundError = require("../../common/errors/NotFoundError");
const UnAuthorizedError = require("../../common/errors/UnAuthorizedError");

exports.setCommentUserId = (req, res, next) => {
    if (!req.body.airport) {
        req.body.airport = req.params.airportId;
    }
    if (!req.body.user) {
        req.body.user = req.user.id;
    }
    next();
};

exports.getAllComments = factory.getAll(Comment);

exports.createComment = async (req, res) => {
    // for nested route
    if (!req.body.airports) {
        req.body.airports = req.params.airportId;
    }
    if (!req.body.user) {
        req.body.user = req.user.id;
    }
    const { comment, landingRate, route, originAirport, destinationAirport, airport, user } =
        req.body;
    const newComment = await Comment.create({
        comment,
        landingRate,
        route,
        originAirport,
        destinationAirport,
        airport,
        user
    });
    res.status(201).json({
        status: "success",
        data: {
            newComment
        }
    });
};

exports.updateComment = async (req, res) => {
    const commentId = req.params.id;
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new NotFoundError("Comment not found.");
    }

    if (comment.user.toString() !== req.user.id) {
        throw new UnAuthorizedError("User is not authorized");
    }

    Object.assign(comment, req.body);

    comment.save();

    res.status(201).json({
        status: "success",
        data: {
            comment
        }
    });
};

exports.deleteComment = async (req, res) => {
    const commentId = req.params.id;
    const comment = await Comment.findByIdAndDelete(commentId);

    if (!comment) {
        throw new NotFoundError("Comment not found.");
    }

    res.status(204).json({
        status: "success",
        data: null
    });
};
