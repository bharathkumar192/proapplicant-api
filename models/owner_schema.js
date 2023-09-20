const mongoose = require("mongoose");

const ownerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phnum: {
      type: String,
      // required: true,
    },
    password: {
      type: String,
      required: true,
    },
    owner: {
      type: Boolean,
      default: true,
    },
  },
  {
    versionKey: false, // Disabled the version key
  }
);

const Owner = mongoose.model("Owner", ownerSchema);

module.exports = Owner;
