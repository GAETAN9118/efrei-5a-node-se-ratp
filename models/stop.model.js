const mongoose = require('mongoose')
const { Schema } = mongoose

const StopSchema = new Schema({
  _id: Number,
  stop_code: Number,
  stop_name: String,
  stop_desc: String,
  stop_coords: {
    type: { type: String, enum: ['Point'] },
    coordinates: [Number] // [longitude, latitude]
  },
  location_type: { type: Number, min: 0, max: 4 },
  parent_station: { type: Number, ref: 'Stop' }
})

module.exports = mongoose.model('Stop', StopSchema)
