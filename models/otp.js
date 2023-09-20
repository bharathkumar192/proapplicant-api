const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
  phnum: { type: String, unique: true },
  otp: { type: Number },
  createdAt: { type: Date, expires: 600 },
});

const OtpModel = mongoose.model("OtpModel", OtpSchema);

module.exports = OtpModel;
