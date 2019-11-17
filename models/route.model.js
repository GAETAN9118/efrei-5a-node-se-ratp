const mongoose = require('mongoose')
const { Schema } = mongoose

const RouteSchema = new Schema({
  _id: Number,
  agency_id: { type: Number, ref: 'Agency' },
  route_short_name: String,
  route_long_name: String,
  route_desc: String,
  route_type: { type: Number, min: 0, max: 7 }
})

module.exports = mongoose.model('Route', RouteSchema)
