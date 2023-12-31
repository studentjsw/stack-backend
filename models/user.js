const mongoose = require("mongoose");
const validator = require("validator");

var userSchema = new mongoose.Schema(
  {
    displayName: { type: "string", required: true },
    email: {
      type: "string",
      required: true,
      lowercase: true,
      validate: (value) => {
        return validator.isEmail(value);
      },
    },
    password: { type: "string", required: true },
    about: { type: "string" },
    tags: { type: "array" },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

var SessionSchema = new mongoose.Schema({
  userId: { type: "string", required: true },
  displayName: { type: "string", required: true },
  token: { type: "string", required: true },
  loggedAt: { type: Date, default: Date.now },
});

const UserDetails = mongoose.model("users", userSchema);
const SessionDetails = mongoose.model("sessions", SessionSchema);

module.exports = { UserDetails, SessionDetails };