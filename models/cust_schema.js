const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    cust_name: {
      type: String,
      required: true,
    },
    cust_id: {
      type: String,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phnum: {
      type: String,
      required: true,
      unique: true,
    },

    reference_id: {
      type: String,
      unique: true,
      required: true,
    },
    admin_name: {
      type: String,
    },
    referred_by: {
      type: String,
    },
    referrals: [
      {
        type: String,
      },
    ],
    year: {
      type: Number,
    },
    intake: {
      type: String,
    },
    type: {
      type: String,
      default: "normal",
    },
    subscriptions: {
      Tool_1: {
        joinedAt: { type: Number, default: 0 },
        duration: { type: String, default: "" },
        proDaysLeft: { type: Number, default: 0 },
        expiryDate: { type: Number, default: 0 },
        amt: { type: Number, default: 0 },
      },
      Tool_2: {
        joinedAt: { type: Number, default: 0 },
        duration: { type: String, default: "" },
        proDaysLeft: { type: Number, default: 0 },
        expiryDate: { type: Number, default: 0 },
        amt: { type: Number, default: 0 },
      },
      Tool_3: {
        joinedAt: { type: Number, default: 0 },
        duration: { type: String, default: "" },
        proDaysLeft: { type: Number, default: 0 },
        expiryDate: { type: Number, default: 0 },
        amt: { type: Number, default: 0 },
      },
    },
  },
  {
    versionKey: false, // Disable the version key
  }
);

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
