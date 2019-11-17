const mongoose = require('mongoose')
const { Schema } = mongoose

const StopTimeSchema = new Schema({
  trip_id: Number,
  arrival_time: Date,
  departure_time: Date,
  stop_id: { type: Number, ref: 'Stop' },
  stop_sequence: { type: Number, min: 0 },
  stop_headsign: String,
  shape_dist_traveled: Number
})

module.exports = mongoose.model('StopTime', StopTimeSchema)
