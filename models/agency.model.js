const mongoose = require('mongoose')
const { Schema } = mongoose

const AgencySchema = new Schema({
  _id: Number,
  agency_name: String,
  agency_url: String,
  agency_timezone: String,
  agency_lang: String,
  agency_phone: String
})

module.exports = mongoose.model('Agency', AgencySchema)
