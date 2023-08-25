const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Must have user name"]
    },
    email: {
        type: String,
        required: [true, "Must have Email"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please provide a validate Email"]
    },
    password: {
        type: String,
        required: [true, "Must have password"],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, "Please confirm your password"],
        //only works when on doc.create or .save
        validate: {
            validator: function (el) {
                return el === this.password;
            },
            message: "Password are not the same"
        }
    },
    passwordChangedAt: Date,
    inactiveStartDate: Date,
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user"
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    photo: String
});

// modified the password before saving to the DB
userSchema.pre("save", async function (next) {
    //Check if the password been modified
    //If not, return
    if (!this.isModified("password")) {
        return next;
    }

    //hash the password
    this.password = await bcrypt.hash(this.password, 12);

    //delete confirmed password after password match validation
    this.passwordConfirm = undefined;
    next();
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimesStamp) {
    // console.log(
    //   parseInt(this.passwordChangedAt.getTime(), 10) / 1000,
    //   JWTTimesStamp
    // );
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime(), 10) / 1000;

        //If JWT Time Stamp is less than the changed time stamp, this means the password has been changed
        return JWTTimesStamp < changedTimeStamp;
    }
    //False means the password has NOT been changed
    return false;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
