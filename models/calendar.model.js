const mongoose = require('mongoose')
const { Schema } = mongoose

const CalendarSchema = new Schema({
  service_id: Number,
  monday: { type: Number, enum: [0, 1] },
  tuesday: { type: Number, enum: [0, 1] },
  wednesday: { type: Number, enum: [0, 1] },
  thursday: { type: Number, enum: [0, 1] },
  friday: { type: Number, enum: [0, 1] },
  saturday: { type: Number, enum: [0, 1] },
  sunday: { type: Number, enum: [0, 1] },
  start_date: Date,
  end_date: Date
})

module.exports = mongoose.model('Calendar', CalendarSchema)
