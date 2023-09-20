const mongoose = require('mongoose');

const proSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  joined_proapp: {
    type: Date,
    required: true,
  },
  pro_type: {
    type: String,
    required: true,
  },
  tools: [{
    tool_name: String,
    pro_start_date: Date,
    total_pro_days_left: Number,
  }],
},
{
  versionKey: false, // Disable the version key
});

const Pro = mongoose.model('Pro', proSchema);

module.exports = Pro;
