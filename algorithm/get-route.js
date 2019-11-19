const debug = require('debug')('ratp:algorithms:get-route')
const {
  getStops,
  getStopsBetweenTwoStops,
  getNextStopTimes
} = require('../queries/queries.js')
const { Dijkstra, Node } = require('../algorithm/dijkstra.js')

async function getRoute (startStopName, endStopName, date) {
  // getStop has a problem: stations are split in 2 because of the two ways
  // we need to use getStops which retrieves all stations that match the name
  // but, we should (TODO it's not done yet) restrict station names based on some
  // "near" field because some stations are named the same way in different cities,
  // like "VERDUN - République"
  const startStops = await getStops(startStopName)
  const endStops = await getStops(endStopName)
  if (!startStops.length || !endStops.length) {
    debug('no stops')
    return []
  }

  date = new Date(date) // has to be ISO date

  const between = await getStopsBetweenTwoStops(startStops[0], endStops[0])

  const nodes = between.map(stop =>
    new Node(stop.stop_name, stop, (node, time) => discover(node, nodes, stop, time))
  )

  const startNodes = startStops.map(ss => nodes.find(n => n.stop._id === ss._id))
  // we create a root node pointing to all the first nodes
  const startNode = new Node('Start')
  createStartNodeRoutes(startNode, startNodes)

  const endNodes = endStops.map(ss => nodes.find(n => n.stop._id === ss._id))
  // we create a end node pointed by all the endNodes
  const endNode = new Node('Stop')
  createEndNodeRoutes(endNode, endNodes)

  const out = await Dijkstra.shortestPathFirst(startNode, endNode, date.getTime())
  if (out.length) {
    out.shift() // remove the first element, only here to simplify the algorithm
    out.pop() // remove the last element, only here to simplify the algorithm
  }
  return out
}

function createStartNodeRoutes (node, startNodes) {
  startNodes.forEach(n => node.addOrientedPath(n, () => 0, { start_nodes: true }))
}

function createEndNodeRoutes (node, endNodes) {
  endNodes.forEach(n => n.addOrientedPath(node, () => 0, { end_nodes: true }))
}

/**
 * Each time we visit a node, it helps us determine the next possible paths
 * So we can add new paths with the associated costs
 * Two possible ways:
 *  * transfers, with have cost in minutes
 *  * next_station_cost, which have cost in milliseconds (to convert)
 */
async function discover (node, nodes, stop, time) {
  const stoptimes = await getNextStopTimes(stop, new Date(time))
  node.stoptimes = stoptimes

  stoptimes.forEach(time => {
    if (time.next_station && time.next_station.stop_id && time.next_station_cost) {
      const nextStationNode = nodes
        .find(n => n.stop._id === time.next_station.stop_id)
      if (nextStationNode) {
        const cost = () => time.next_station_cost
        const moreinfo = {
          route_short_name: time.route_short_name,
          route_long_name: time.route_long_name
        }
        node.addOrientedPath(nextStationNode, cost, moreinfo)
      }
    }

    time.transfers.forEach(transfer => {
      // here we try to find the nodes that are linked to our current stop
      // we are checking each node where the stop_id is equal to to_stop_id or
      // from_stop_id
      const transferNode = nodes.find(n =>
        (transfer.from_stop_id === time.stop_id && n.stop._id === transfer.to_stop_id) ||
        (transfer.to_stop_id === time.stop_id && n.stop._id === transfer.from_stop_id)
      )
      if (!transferNode) return

      const cost = () => transfer.min_transfer_time * 1000
      // transfers are not oriented because it's by feet
      node.addNonOrientedPath(transferNode, cost, { transfer: true })
    })
  })
}

module.exports = getRoute
