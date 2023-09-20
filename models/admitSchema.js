const mongoose = require("mongoose");

const AdmitsSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  intake: {
    type: String,
  },
  decision: {
    type: String,
  },
  uni: {
    type: String,
  },
  course: {
    type: String,
  },
  major: {
    type: String,
  },
  cgpa: {
    type: Number,
  },
  clg: {
    type: String,
  },
  gre_ver: {
    type: String,
  },
  gre_qua: {
    type: String,
  },
  gre_awa: {
    type: String,
  },
  gre_tot: {
    type: String,
  },
  eng_rea: {
    type: Number,
  },
  eng_spe: {
    type: Number,
  },
  eng_lis: {
    type: Number,
  },
  eng_wri: {
    type: Number,
  },
  eng_tot: {
    type: Number,
  },
  lang_type: {
    type: String,
  },
  work_exp: {
    type: Number,
    default: 0,
  },
  papers: {
    default: 0,
    type: Number,
  },
  username: {
    type: String,
  },
  year: {
    type: Number,
  },
  approved: {
    type: Boolean,
    default: false,
  },
});

const Admit = mongoose.model("Admit", AdmitsSchema);

module.exports = Admit;
