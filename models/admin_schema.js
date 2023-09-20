const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phnum: {
      type: String,
    },
    admin_id: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: Boolean,
      required: true,
      default: true,
    },
    password: {
      type: String,
      required: true,
    },
    customers: [
      {
        type: String,
      },
    ],
    owner: {
      type: Boolean,
      default: false,
    },
  },
  {
    versionKey: false, // Disable the version key
  }
);

// Pre-save middleware to generate admin_id
adminSchema.pre("save", function (next) {
  if (!this.admin_id) {
    this.admin_id = "AD" + generateRandomNumber();
  }
  next();
});

function generateRandomNumber() {
  return Math.floor(100000 + Math.random() * 900000);
}

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
