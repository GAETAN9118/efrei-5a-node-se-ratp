const debug = require('debug')('ratp:init-db')
const argv = require('yargs')
  .usage('Usage: $0 [path]')
  .alias('p', 'path')
  .demandOption('p')
  .describe('path', 'path of the csv files')
  .argv

const { DBPATH } = require('../params')
const path = require('path')
const moment = require('moment')
const csvParser = require('csv-parser')
const fs = require('fs')
const mongoose = require('mongoose')

mongoose.connect(DBPATH, { useNewUrlParser: true, useUnifiedTopology: true })

const Agency = require('../models/agency.model.js')
const CalendarDate = require('../models/calendarDate.model.js')
const Calendar = require('../models/calendar.model.js')
const Route = require('../models/route.model.js')
const Stop = require('../models/stop.model.js')
const StopTime = require('../models/stopTime.model.js')
const Transfer = require('../models/transfer.model.js')
const Trip = require('../models/trip.model.js')

const csvPath = argv.p

async function run () {
  try {
    const dir = path.join(csvPath)
    await StopTime.deleteMany({})
    await importCSV(path.join(dir, 'stop_times.txt'), stopTimesHandler, 100000)
    await Agency.deleteMany({})
    await importCSV(path.join(dir, 'agency.txt'), agencyHandler)
    await CalendarDate.deleteMany({})
    await importCSV(path.join(dir, 'calendar_dates.txt'), calendarDatesHandler)
    await Calendar.deleteMany({})
    await importCSV(path.join(dir, 'calendar.txt'), calendarHandler)
    await Route.deleteMany({})
    await importCSV(path.join(dir, 'routes.txt'), routesHandler)
    await Stop.deleteMany({})
    await importCSV(path.join(dir, 'stops.txt'), stopsHandler)
    await Transfer.deleteMany({})
    await importCSV(path.join(dir, 'transfers.txt'), transfersHandler)
    await Trip.deleteMany({})
    await importCSV(path.join(dir, 'trips.txt'), tripsHandler)
    process.exit(0)
  } catch (err) {
    debug('something bad happened', err)
  }
}

function intOrUndef (v) {
  return v ? parseInt(v) : undefined
}

function orUndef (v) {
  return v || undefined
}

async function agencyHandler (array, counter) {
  const agencies = array.map(_ => ({
    _id: parseInt(_.agency_id),
    agency_name: orUndef(_.agency_name),
    agency_url: orUndef(_.agency_url),
    agency_timezone: orUndef(_.agency_timezone),
    agency_lang: orUndef(_.agency_lang),
    agency_phone: orUndef(_.agency_phone)
  }))

  debug('agencies', counter, agencies)
  return Agency.collection.insertMany(agencies)
}

async function stopsHandler (array, counter) {
  const stops = array.map(_ => ({
    _id: parseInt(_.stop_id),
    stop_code: orUndef(_.stop_code),
    stop_name: orUndef(_.stop_name),
    stop_desc: orUndef(_.stop_desc),
    stop_coords: {
      type: 'Point',
      coordinates: [_.stop_lon, _.stop_lat]
    },
    location_type: parseInt(_.location_type),
    parent_station: intOrUndef(_.parent_station)
  }))

  debug('stops', counter, stops)
  return Stop.collection.insertMany(stops)
}

function toValidDate (time) {
  if (parseInt(time.slice(0, 2)) >= 24) {
    const hour = parseInt(time.slice(0, 2)) - 24
    const arrivalTime = `${hour < 10 ? `0${hour}` : hour}:${time.slice(3)}`
    return moment.utc(`1970-01-02 ${arrivalTime}`).toDate()
  } else {
    return moment.utc(`1970-01-01 ${time}`).toDate()
  }
}

function stopTimesHandler (array, counter) {
  const stoptimes = array.map(_ => ({
    trip_id: parseInt(_.trip_id),
    arrival_time: toValidDate(_.arrival_time),
    departure_time: toValidDate(_.departure_time),
    stop_id: parseInt(_.stop_id),
    stop_sequence: intOrUndef(_.stop_sequence),
    stop_headsign: orUndef(_.stop_headsign),
    shape_dist_traveled: orUndef(_.shape_dist_traveled)
  }))

  debug('stoptimes', counter, stoptimes.length)
  return StopTime.collection.insertMany(stoptimes)
}

function calendarDatesHandler (array, counter) {
  const calendarDates = array.map(_ => ({
    service_id: parseInt(_.service_id),
    date: moment.utc(_.date).toDate(),
    exception_type: parseInt(_.exception_type)
  }))

  debug('calendarDates', counter, calendarDates.length)
  return CalendarDate.collection.insertMany(calendarDates)
}

function calendarHandler (array, counter) {
  const calendar = array.map(_ => ({
    service_id: parseInt(_.service_id),
    monday: parseInt(_.monday),
    tuesday: parseInt(_.tuesday),
    wednesday: parseInt(_.wednesday),
    thursday: parseInt(_.thursday),
    friday: parseInt(_.friday),
    saturday: parseInt(_.saturday),
    sunday: parseInt(_.sunday),
    start_date: moment.utc(_.start_date).toDate(),
    end_date: moment.utc(_.end_date).toDate()
  }))

  debug('calendar', counter, calendar.length)
  return Calendar.collection.insertMany(calendar)
}

function routesHandler (array, counter) {
  const routes = array.map(_ => ({
    _id: parseInt(_.route_id),
    agency_id: parseInt(_.agency_id),
    route_short_name: orUndef(_.route_short_name),
    route_long_name: orUndef(_.route_long_name),
    route_desc: orUndef(_.route_desc),
    route_type: parseInt(_.route_type),
    route_url: orUndef(_.saturday),
    route_color: orUndef(_.sunday),
    route_text_color: orUndef(_.route_text_color)
  }))

  debug('routes', counter, routes.length)
  return Route.collection.insertMany(routes)
}

function transfersHandler (array, counter) {
  const transfers = array.map(_ => ({
    from_stop_id: parseInt(_.from_stop_id),
    to_stop_id: parseInt(_.to_stop_id),
    transfer_type: parseInt(_.transfer_type),
    min_transfer_time: parseInt(_.min_transfer_time)
  }))

  debug('transfers', counter, transfers.length)
  return Transfer.collection.insertMany(transfers)
}

function tripsHandler (array, counter) {
  const trips = array.map(_ => ({
    trip_id: parseInt(_.trip_id),
    route_id: parseInt(_.route_id),
    service_id: parseInt(_.service_id),
    trip_headsign: orUndef(_.trip_headsign),
    trip_short_name: orUndef(_.trip_short_name),
    direction_id: parseInt(_.direction_id),
    shape_id: intOrUndef(_.shape_id)
  }))

  debug('trips', counter, trips.length)
  return Trip.collection.insertMany(trips)
}

/**
 * @param {String} filePath
 * @param {Function} save
 * @param {Number} [batchSize=10000]
 * @async
 */
function importCSV (filePath, save, batchSize = 10000) {
  return new Promise((resolve, reject) => {
    let counter = 1
    const tmp = []
    const stream = fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', async (data) => {
        try {
          if (tmp.length < batchSize) {
            tmp.push(data)
            return
          }
          stream.pause()
          await save(tmp, counter++)
          tmp.length = 0
          stream.resume()
        } catch (err) {
          stream.destroy()
          reject(err)
        }
      })
      .on('end', async () => {
        if (tmp.length > 0) {
          await save(tmp, counter++)
        }
        resolve()
      })
  })
}

run()
