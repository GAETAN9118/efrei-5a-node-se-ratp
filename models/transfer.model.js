const mongoose = require('mongoose')
const { Schema } = mongoose

const TransferSchema = new Schema({
  from_stop_id: { type: Number, ref: 'Stop' },
  to_stop_id: { type: Number, ref: 'Stop' },
  transfer_type: { type: Number, min: 0, max: 3 },
  min_transfer_time: { type: Number }
})

module.exports = mongoose.model('Transfer', TransferSchema)
