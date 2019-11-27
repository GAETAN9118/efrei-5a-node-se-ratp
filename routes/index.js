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

/** @type {Node[]} */
const nodesArrays = []

function genOutputNodes (nodes) {
  return nodes.map(node => node.export())
}

router.get('/api/route/updates/:id', async function (req, res) {
  const id = parseInt(req.params.id)
  if (!nodesArrays[id]) {
    res.status(404)
    res.send('not found')
    return
  }

  console.log('done', nodesArrays[id].done)
  res.json({
    values: genOutputNodes(nodesArrays[id]),
    goodPath: nodesArrays[id].goodPath ? genOutputNodes(nodesArrays[id].goodPath) : [],
    done: nodesArrays[id].done
  })

  if (nodesArrays[id].done) {
    nodesArrays.splice(id, 1)
  }
})

router.get('/api/route', async function (req, res) {
  const { start, stop } = req.query
  const id = Math.floor(Math.random() * 1000) + 1

  const route = getRoute(start, stop, new Date())
  const { value } = await route.next()
  const now = Date.now()
  route.next()
    .then((result) => {
      console.log('finished, elapsed:', (Date.now() - now) / 1000)
      nodesArrays[id].done = true
      nodesArrays[id].goodPath = result.value
    })

  nodesArrays[id] = value

  res.json({ values: genOutputNodes(nodesArrays[id]), id, done: false })
})

module.exports = router
