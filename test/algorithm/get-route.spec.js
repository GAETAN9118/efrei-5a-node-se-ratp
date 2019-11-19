/* eslint-disable no-unused-expressions */
const sinon = require('sinon')
sinon.test = require('sinon-test')(sinon)
const { expect } = require('chai')
const mongoose = require('mongoose')
const { DBPATH } = require('../../params.js')

const getRoute = require('../../algorithm/get-route.js')

/**
 * These tests only work if the database is loaded with the
 * november 2019 set of GTFS files from the RATP.
 *
 * To make everything work:
 *  * mongodb should be running
 *  * the params.js file should be correct
 */

describe('get.route.controller.js', () => {
  before(() => {
    mongoose.connect(DBPATH, { useNewUrlParser: true, useUnifiedTopology: true })
  })

  after(() => {
    mongoose.disconnect()
  })

  describe('getRoute', () => {
    it('should return a stop if it exists', sinon.test(async function () {
      this.timeout(100000)
      const date = '2019-11-18T14:00:00Z'
      const start = (new Date(date)).getTime()
      const result = await getRoute('Glacière', 'Jussieu', '2019-11-18T14:00:00Z')
      console.log('result', result)
      console.log('result', result.map(r => r.name))
      // console.log('result', result.map(r => r.paths.map(p => p.moreinfo)))
      console.log('times', result.map(r => (r.distance - start) / 1000 / 60))
      console.log('total time',
        (result[result.length - 1].distance - start) / 1000 / 60)
    }))
  })
})