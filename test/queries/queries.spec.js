/* eslint-disable no-unused-expressions */
const sinon = require('sinon')
sinon.test = require('sinon-test')(sinon)
const { expect } = require('chai')
const {
  getStop,
  getStops,
  getStopsBetweenTwoStops,
  getNextStopTimes
} = require('../../queries/queries.js')
const mongoose = require('mongoose')
const { DBPATH } = require('../../params.js')

const Stop = require('../../models/stop.model.js')

/**
 * These tests only work if the database is loaded with the
 * november 2019 set of GTFS files from the RATP.
 *
 * To make everything work:
 *  * mongodb should be running
 *  * the params.js file should be correct
 */

describe('queries.js', () => {
  before(() => {
    mongoose.connect(DBPATH, { useNewUrlParser: true, useUnifiedTopology: true })
  })

  after(() => {
    mongoose.disconnect()
  })

  describe('getStop', () => {
    it('should return a stop if it exists', sinon.test(async function () {
      const result = await getStop('Glacière')
      expect(result).to.be.an.instanceOf(Stop)
      expect(result).to.have.property('stop_name').equal('Glacière')
    }))

    it('should return a stop if the name is approximate', sinon.test(async function () {
      const results = await getStop('Glaci')
      expect(results).to.be.an.instanceOf(Stop)
    }))

    it('should return nothing if the name is unknown', sinon.test(async function () {
      const results = await getStop('blablabla')
      expect(results).to.equal(null)
    }))
  })

  describe('getStopsBetweenTwoStops', () => {
    it('should return a list of stations in a circle between two given stations', sinon.test(async function () {
      const glaciere = await getStop('Glacière')
      const jussieu = await getStop('Jussieu')
      const results = await getStopsBetweenTwoStops(glaciere, jussieu)
      expect(results).to.be.an('array').of.length(284)
    }))
  })

  describe('getNextStopTimes', () => {
    it.skip('should return a list of the next stop times, next station in the trip and transfer times for a specific stop, at a specific time', sinon.test(async function () {
      const stops = await getStops('Glacière')
      const date = new Date('2019-11-18T14:00:00Z')
      const results = await getNextStopTimes(stops[1], date)
      console.log('results', results)
      expect(results).to.have.deep.members([
        {
          departure_time: new Date('1970-01-01T14:00:00.000Z'),
          transfers: [
            {
              from_stop_id: 2217,
              to_stop_id: 7921049,
              transfer_type: 2,
              min_transfer_time: 284
            },
            {
              from_stop_id: 2217,
              to_stop_id: 7921110,
              transfer_type: 2,
              min_transfer_time: 285
            },
            {
              from_stop_id: 2217,
              to_stop_id: 7932100,
              transfer_type: 2,
              min_transfer_time: 250
            },
            {
              from_stop_id: 2217,
              to_stop_id: 7932101,
              transfer_type: 2,
              min_transfer_time: 238
            }
          ],
          stop_id: 2217,
          route_id: 2093209,
          route_short_name: '6',
          route_long_name: '(NATION <-> CHARLES DE GAULLE - ETOILE) - Retour',
          trip_id: '17727733081193703',
          trip_direction: 1,
          trip_service_id: 2773308,
          stop_sequence: 17,
          arrival_time: new Date('1970-01-01T14:00:00.000Z'),
          next_station: {
            arrival_time: new Date('1970-01-01T14:02:00.000Z'),
            departure_time: new Date('1970-01-01T14:02:00.000Z'),
            stop_id: 2177,
            stop_sequence: 18
          },
          next_station_cost: 120000
        }
      ])
    }))
    it('should return a list of the next stop times, next station in the trip and transfer times for a specific stop, at a specific time', sinon.test(async function () {
      const stops = await getStops('GLACIERE - AUGUSTE BLANQUI')
      // console.log('stops', stops)
      const date = new Date('2019-11-18T14:03:58.000Z')
      const i = 3
      console.log('\n\n\n\n---------------\n')
      console.log('stop', stops[i])
      const results = await getNextStopTimes(stops[i], date)
      console.log('results', i, results)
    }))
  })
})
