// noinspection JSUnresolvedVariable,JSCheckFunctionSignatures

require("dotenv").config({ path: "../../config.env" });

module.exports.getMetar = async (req, res) => {
    res.status(200).json({
        status: "success",
    });
};
