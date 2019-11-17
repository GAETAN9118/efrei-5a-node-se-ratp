const mongoose = require('mongoose')
const { Schema } = mongoose

const CalendarDatesSchema = new Schema({
  service_id: Number,
  date: Date,
  exception_type: { type: Number, min: 0, max: 3 }
})

module.exports = mongoose.model('CalendarDates', CalendarDatesSchema)
