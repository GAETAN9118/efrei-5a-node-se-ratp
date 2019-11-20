var express = require('express')
var router = express.Router()
const { getStops } = require('../queries/queries.js')
const getRoute = require('../algorithm/get-route.js')

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' })
})

router.get('/map', function (req, res, next) {
  res.render('map')
})

router.get('/api/stop', async function (req, res, next) {
  const { name } = req.query
  console.log('stop1')
  const stops = await getStops(name)
  console.log('stop2')
  res.json(stops)
})

const currentRoutes = {}
const nodesArrays = {}

router.get('/api/route/updates/:id', async function (req, res) {
  const { id } = req.params
  res.json(nodesArrays[id])
})

router.get('/api/route', async function (req, res) {
  const { start, stop } = req.query
  console.log('stop1')
  const id = Math.floor(Math.random() * 1000) + 1

  currentRoutes[id] = getRoute(start, stop, new Date())
  const { value } = await currentRoutes[id].next()
  nodesArrays[id] = value
  console.log('currentRoutes', value)

  res.json({ values: value, id })
})

module.exports = router
