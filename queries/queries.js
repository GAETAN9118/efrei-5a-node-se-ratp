const Stop = require('../models/stop.model.js')
const StopTime = require('../models/stopTime.model.js')

/**
 * @param {String} name
 * @async
 * @returns {Promise<Stop>}
 */
function getStop (name) {
  return Stop.findOne({ stop_name: new RegExp(`.*${name}.*`, 'i') })
}

/**
 * @param {String} name
 * @async
 * @returns {Promise<Array<Stop>>}
 */
function getStops (name) {
  return Stop.find({ stop_name: new RegExp(`.*${name}.*`, 'i') })
}

/**
 * @param {Stop} s1
 * @param {Stop} s2
 * @async
 * @returns {Promise<Array<Stop>>}
 */
function getStopsBetweenTwoStops (s1, s2) {
  const { stop_coords: { coordinates: c1 } } = s1
  const { stop_coords: { coordinates: c2 } } = s2
  const lonCenter = (c1[0] + c2[0]) / 2
  const latCenter = (c1[1] + c2[1]) / 2
  const radius = Math.abs(c1[0] - c2[0])
  return Stop.find({
    stop_coords: {
      $geoWithin: {
        $center: [[lonCenter, latCenter], radius]
      }
    }
  })
}

/*
let day
switch (today.getDay()) {
  case 0: day = 'sunday'; break
  case 1: day = 'monday'; break
  case 2: day = 'tuesday'; break
  case 3: day = 'wednesday'; break
  case 4: day = 'thursday'; break
  case 5: day = 'friday'; break
  case 6: day = 'saturday'; break
} */

/**
 * @param {Stop} stop
 * @param {Date} date
 */
function getNextStopTimes (stop, date) {
  const today = new Date(date)
  today.setUTCHours(0)
  today.setUTCMinutes(0)
  today.setUTCSeconds(0)
  today.setUTCMilliseconds(0)
  const timestamp = date.getTime() - today.getTime()

  const max = timestamp + 45 * 60 * 1000 // on cherche dans les max +45m

  return StopTime.aggregate([
    { // first we select all the stop times matching the stop id and departure time
      $match: {
        stop_id: stop._id,
        departure_time: { $gte: new Date(timestamp), $lt: new Date(max) }
      }
    },
    { // then we select the fields we want to use, to avoid loosing memory
      $project: {
        _id: 0,
        stop_id: true,
        trip_id: true,
        arrival_time: true,
        departure_time: true,
        stop_sequence: true
      }
    },
    // we sort by reverse order, the sooner the better
    { $sort: { departure_time: -1 } },
    { // make a "JOIN" to the trips collection based on trip_id
      $lookup: {
        from: 'trips',
        localField: 'trip_id',
        foreignField: 'trip_id',
        as: 'trip'
      }
    },
    { // select the fields we want to keep, and transform the trip array into
      // a single value (because we know trip_id is unique)
      $project: {
        stop_id: true,
        trip_id: true,
        stop_sequence: true,
        arrival_time: true,
        departure_time: true,
        trip: { $arrayElemAt: ['$trip', 0] }
      }
    },
    { // make a "JOIN" with the "routes" collection with trip.route_id
      $lookup: {
        from: 'routes',
        localField: 'trip.route_id',
        foreignField: '_id',
        as: 'route'
      }
    },
    { // select the fields, make "route" be a single sub-doc instead of array
      $project: {
        stop_id: true,
        trip_id: true,
        stop_sequence: true,
        arrival_time: true,
        departure_time: true,
        trip: {
          route_id: true,
          service_id: true,
          direction_id: true
        },
        route: { $arrayElemAt: ['$route', 0] }
      }
    },
    { // make a "GROUP BY" based on id, name, direction, service_id
      // and only select the minimum value for the departure_time
      // keep the trip_id values to be able to find next stations
      $group: {
        _id: {
          stop_id: '$stop_id',
          route_id: '$route._id',
          route_short_name: '$route.route_short_name',
          route_long_name: '$route.route_long_name',
          trip_direction: '$trip.direction_id',
          trip_service_id: '$trip.service_id',
          stop_sequence: '$stop_sequence'
        },
        trip_info: {
          $push: {
            trip_id: '$trip_id',
            departure_time: '$departure_time',
            arrival_time: '$arrival_time'
          }
        },
        departure_time: { $min: '$departure_time' }
      }
    },
    { // keep only the trip_id whose departure_time equals the selected departure_time
      $project: {
        _id: true,
        departure_time: true,
        trip_info: {
          $filter: {
            input: '$trip_info',
            as: 'trip',
            cond: { $eq: ['$$trip.departure_time', '$departure_time'] }
          }
        }
      }
    },
    { // flatten the trips array
      $project: {
        _id: true,
        departure_time: true,
        trip_info: { $arrayElemAt: ['$trip_info', 0] }
      }
    },
    { // select calendardates to know if the trip is passing on the current day
      // check on service_id, date, and exception_type (if 1, "on", 0, "off")
      $lookup: {
        from: 'calendardates',
        let: { trip_service_id: '$_id.trip_service_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$service_id', '$$trip_service_id'] },
                  { $eq: ['$date', today] },
                  { exception_type: 1 }
                ]
              }
            }
          },
          { // only extract the date
            $project: { _id: 0, date: true }
          }
        ],
        as: 'service'
      }
    },
    { // remove all the results that do not have a transport today (service empty)
      $match: {
        service: { $ne: [] }
      }
    },
    { // we get all transfers for the current station
      $lookup: {
        from: 'transfers',
        // localField: '_id.stop_id',
        // foreignField: 'from_stop_id',
        let: { ext_stop_id: '$_id.stop_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ['$from_stop_id', '$$ext_stop_id'] },
                  { $eq: ['$to_stop_id', '$$ext_stop_id'] }
                ]
              }
            }
          }
        ],
        as: 'transfers'
      }
    },
    { // we go check the next bus in the sequence of the trip
      // same trip_id, and stop_sequence + 1
      $lookup: {
        from: 'stoptimes',
        let: {
          ext_trip_id: '$trip_info.trip_id',
          ext_stop_sequence: '$_id.stop_sequence'
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$trip_id', '$$ext_trip_id'] },
                  { $gt: ['$stop_sequence', '$$ext_stop_sequence'] }
                ]
              }
            }
          },
          { $limit: 1 }, // we assume that the results are ordered, and take the first
          {
            $project: {
              _id: 0,
              arrival_time: true,
              departure_time: true,
              stop_id: true,
              stop_sequence: true
            }
          }
        ],
        as: 'next_station'
      }
    },
    { // refactor the values to make them more user-friendly, extract next_station
      $project: {
        _id: 0,
        stop_id: '$_id.stop_id',
        route_id: '$_id.route_id',
        route_short_name: '$_id.route_short_name',
        route_long_name: '$_id.route_long_name',
        trip_id: '$trip_info.trip_id',
        trip_direction: '$_id.trip_direction',
        trip_service_id: '$_id.trip_service_id',
        stop_sequence: '$_id.stop_sequence',
        departure_time: true,
        arrival_time: '$trip_info.arrival_time',
        transfers: {
          from_stop_id: true,
          to_stop_id: true,
          transfer_type: true,
          min_transfer_time: true
        },
        next_station: { $arrayElemAt: ['$next_station', 0] }
      }
    }, /*
    {
      $lookup: {
        from: 'stops',
        localField: 'next_station.stop_id',
        foreignField: '_id',
        as: 'next_station_stop'
      }
    } */
    { // calculate the time difference between the current and next station
      $project: {
        stop_id: true,
        route_id: true,
        route_short_name: true,
        route_long_name: true,
        trip_id: true,
        trip_direction: true,
        trip_service_id: true,
        stop_sequence: true,
        departure_time: true,
        arrival_time: true,
        transfers: true,
        next_station: {
          arrival_time: true,
          departure_time: true,
          stop_id: true,
          stop_sequence: true
        },
        // next_station_stop: { $arrayElemAt: ['$next_station_stop', 0] },
        next_station_cost: {
          $subtract: ['$next_station.departure_time', '$departure_time']
        }
      }
    }
  ]).exec()
}

module.exports = {
  getStop,
  getStops,
  getStopsBetweenTwoStops,
  getNextStopTimes
}
