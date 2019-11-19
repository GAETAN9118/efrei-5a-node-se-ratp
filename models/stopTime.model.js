const mongoose = require('mongoose')
const { Schema } = mongoose

const StopTimeSchema = new Schema({
  trip_id: { type: String },
  arrival_time: Date,
  departure_time: { type: Date },
  stop_id: { type: Number, ref: 'Stop' },
  stop_sequence: { type: Number, min: 0 },
  stop_headsign: String,
  shape_dist_traveled: Number
})

StopTimeSchema.index({ stop_id: 1, departure_time: 1 })
StopTimeSchema.index({ trip_id: 1, departure_time: 1 })
StopTimeSchema.index({ stop_sequence: 1 })

module.exports = mongoose.model('StopTime', StopTimeSchema)
