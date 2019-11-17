const debug = require('debug')('ratp:init-db')
const path = require('path')
const moment = require('moment')
const argv = require('yargs')
  .usage('Usage: $0 [path]')
  .alias('p', 'path')
  .demandOption('p')
  .describe('path', 'path of the csv files')
  .argv

const { DBPATH } = require('../params')

const importCSV = require('./importCSV.js')
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

class InitDB {
  static async run () {
    try {
      const dir = path.join(csvPath)
      await StopTime.deleteMany({})
      await importCSV(path.join(dir, 'stop_times.txt'), InitDB.stopTimesHandler, 100000)
      await Agency.deleteMany({})
      await importCSV(path.join(dir, 'agency.txt'), InitDB.agencyHandler)
      await CalendarDate.deleteMany({})
      await importCSV(path.join(dir, 'calendar_dates.txt'), InitDB.calendarDatesHandler)
      await Calendar.deleteMany({})
      await importCSV(path.join(dir, 'calendar.txt'), InitDB.calendarHandler)
      await Route.deleteMany({})
      await importCSV(path.join(dir, 'routes.txt'), InitDB.routesHandler)
      await Stop.deleteMany({})
      await importCSV(path.join(dir, 'stops.txt'), InitDB.stopsHandler)
      await Transfer.deleteMany({})
      await importCSV(path.join(dir, 'transfers.txt'), InitDB.transfersHandler)
      await Trip.deleteMany({})
      await importCSV(path.join(dir, 'trips.txt'), InitDB.tripsHandler)
      process.exit(0)
    } catch (err) {
      debug('something bad happened', err)
    }
  }

  static async agencyHandler (array, counter) {
    const agencies = array.map(_ => ({
      _id: parseInt(_.agency_id),
      agency_name: _.agency_name || undefined,
      agency_url: _.agency_url || undefined,
      agency_timezone: _.agency_timezone || undefined,
      agency_lang: _.agency_lang || undefined,
      agency_phone: _.agency_phone || undefined
    }))

    debug('agencies', counter, agencies)
    await Agency.collection.insertMany(agencies)
  }

  static async stopsHandler (array, counter) {
    const stops = array.map(_ => ({
      _id: parseInt(_.stop_id),
      stop_code: _.stop_code || undefined,
      stop_name: _.stop_name || undefined,
      stop_desc: _.stop_desc || undefined,
      stop_coords: {
        type: 'Point',
        coordinates: [_.stop_lon, _.stop_lat]
      },
      location_type: parseInt(_.location_type),
      parent_station: _.parent_station ? parseInt(_.parent_station) : undefined
    }))

    debug('stops', counter, stops)
    await Stop.collection.insertMany(stops)
  }

  static async stopTimesHandler (array, counter) {
    const stoptimes = array.map(_ => {
      let arrivalTime, departureTime
      if (parseInt(_.arrival_time.slice(0, 2)) >= 24) {
        const hour = parseInt(_.arrival_time.slice(0, 2)) - 24
        arrivalTime = `${hour < 10 ? `0${hour}` : hour}:${_.arrival_time.slice(3)}`
        arrivalTime = `1970-01-02 ${arrivalTime}`
      } else {
        arrivalTime = `1970-01-01 ${_.arrival_time}`
      }

      if (parseInt(_.departure_time.slice(0, 2)) >= 24) {
        const hour = parseInt(_.departure_time.slice(0, 2)) - 24
        departureTime = `${hour < 10 ? `0${hour}` : hour}:${_.departure_time.slice(3)}`
        departureTime = `1970-01-02 ${departureTime}`
      } else {
        departureTime = `1970-01-01 ${_.departure_time}`
      }
      return {
        trip_id: parseInt(_.trip_id),
        arrival_time: moment.utc(arrivalTime).toDate(),
        departure_time: moment.utc(departureTime).toDate(),
        stop_id: parseInt(_.stop_id),
        stop_sequence: _.stop_sequence ? parseInt(_.stop_sequence) : undefined,
        stop_headsign: _.stop_headsign || undefined,
        shape_dist_traveled: _.shape_dist_traveled || undefined
      }
    })

    debug('stoptimes', counter, stoptimes.length)
    stoptimes.forEach((_, index) => {
      if (_.arrival_time.toString() === 'Invalid Date') {
        console.log(_)
        debug(_)
      }
    })

    await StopTime.collection.insertMany(stoptimes)
  }

  static async calendarDatesHandler (array, counter) {
    const calendarDates = array.map(_ => ({
      service_id: parseInt(_.service_id),
      date: moment.utc(_.date).toDate(),
      exception_type: parseInt(_.exception_type)
    }))

    debug('calendarDates', counter, calendarDates.length)
    await CalendarDate.collection.insertMany(calendarDates)
  }

  static async calendarHandler (array, counter) {
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
    await Calendar.collection.insertMany(calendar)
  }

  static async routesHandler (array, counter) {
    const routes = array.map(_ => ({
      _id: parseInt(_.route_id),
      agency_id: parseInt(_.agency_id),
      route_short_name: _.route_short_name || undefined,
      route_long_name: _.route_long_name || undefined,
      route_desc: _.route_desc || undefined,
      route_type: parseInt(_.route_type),
      route_url: _.saturday || undefined,
      route_color: _.sunday || undefined,
      route_text_color: _.route_text_color || undefined
    }))

    debug('routes', counter, routes.length)
    await Route.collection.insertMany(routes)
  }

  static async transfersHandler (array, counter) {
    const transfers = array.map(_ => ({
      from_stop_id: parseInt(_.from_stop_id),
      to_stop_id: parseInt(_.to_stop_id),
      transfer_type: parseInt(_.transfer_type),
      min_transfer_time: parseInt(_.min_transfer_time)
    }))

    debug('transfers', counter, transfers.length)
    await Transfer.collection.insertMany(transfers)
  }

  static async tripsHandler (array, counter) {
    const trips = array.map(_ => ({
      trip_id: parseInt(_.trip_id),
      route_id: parseInt(_.route_id),
      service_id: parseInt(_.service_id),
      trip_headsign: _.trip_headsign || undefined,
      trip_short_name: _.trip_short_name || undefined,
      direction_id: parseInt(_.direction_id),
      shape_id: _.shape_id ? parseInt(_.shape_id) : undefined
    }))

    debug('trips', counter, trips.length)
    await Trip.collection.insertMany(trips)
  }
}

InitDB.run()
