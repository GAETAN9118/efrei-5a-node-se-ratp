const mongoose = require('mongoose')
const { Schema } = mongoose

const CalendarDatesSchema = new Schema({
  service_id: Number,
  date: Date,
  exception_type: { type: Number, min: 0, max: 3 }
})

CalendarDatesSchema.index({ service_id: 1, date: 1, exception_type: 1 })

module.exports = mongoose.model('CalendarDates', CalendarDatesSchema)
