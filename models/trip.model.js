const mongoose = require('mongoose')
const { Schema } = mongoose

const TripSchema = new Schema({
  trip_id: Number,
  route_id: { type: Number, ref: 'Route' },
  service_id: Number,
  trip_headsign: String,
  trip_short_name: String,
  direction_id: { type: Number, min: 0, max: 1 },
  shape_id: Number
})

module.exports = mongoose.model('Trip', TripSchema)
