const debug = require('debug')('ratp:algorithms:dijkstra')
class Path {
  constructor (cost, node, moreinfo) {
    /** @member {Function} cost */
    this.cost = cost
    /** @member {Node} node */
    this.node = node
    /** @member {Object} moreinfo */
    this.moreinfo = moreinfo
  }
}

class Node {
  /**
   * @param {String} name
   * @param {Object} stop
   * @param {Function} discover
   * @param {Array<Path>} paths
   */
  constructor (name, stop = {}, discover = async () => {}, paths = []) {
    /** @member {Boolean} */
    this.visited = false
    /** @member {String} */
    this.name = name
    /** @member {Array<Link>} paths */
    this.paths = paths
    /** @member {Number} distance */
    this.distance = Infinity
    /** @member {Node} visitedFrom */
    this.visitedFrom = null
    /** @member {Function} discover */
    this.discover = discover
    /** @member {Object} stop */
    this.stop = stop
  }

  /**
   * @param {Node} node
   * @param {Number} cost
   * @param {Object} [moreinfo]
   */
  addOrientedPath (node, cost, moreinfo) {
    const current = this.paths.findIndex(n => n.node === node)
    if (current !== -1) {
      this.paths.splice(current, 1)
    }
    this.paths.push(new Path(cost, node, moreinfo))
  }

  /**
   * @param {Node} node
   * @param {Function} cost
   */
  addNonOrientedPath (node, cost) {
    this.addOrientedPath(node, cost)
    node.addOrientedPath(this, cost)
  }

  /**
   * Calculates the new distance for each node
   * Already visited nodes shouldn't be updated
   * The {@link Node}s returned are the nodes which were never calculated before
   * @returns {Node[]|null}
   */
  async calcNeighboursTentativeDistance () {
    /** @type {Node[]} */
    const toVisit = []
    for (const p of this.paths) {
      if (p.node.visited) continue

      if (p.node.distance === Infinity) {
        toVisit.push(p.node)
      }

      const newCost = await p.cost() + this.distance
      if (newCost < p.node.distance) {
        p.node.distance = newCost
        p.node.visitedFrom = this
      }
    }

    return toVisit
  }
}

class Dijkstra {
  /**
   * Calculates the shortest path, and returns a list of nodes
   * that we need to go through to have the path
   * @param {Node} startNode
   * @param {Node} endNode
   * @param {Number} initialDistance start date
   * @returns {Array<Node>}
   */
  static async shortestPathFirst (startNode, endNode, initialDistance = 0) {
    if (!startNode === endNode) return []

    startNode.distance = initialDistance
    startNode.visited = true

    debug('startNode distance', startNode.distance)
    const listOfNodes = [startNode]

    while (listOfNodes.length) {
      const curr = listOfNodes.shift()
      await curr.discover(curr, curr.distance)
      debug('curr paths', curr.paths.map(_ => _.node.name))
      curr.visited = true
      if (endNode === curr) {
        return Dijkstra.generatePath(endNode)
      }

      const toVisit = await curr.calcNeighboursTentativeDistance()

      for (let i = 0; i < toVisit.length; i++) {
        if (!listOfNodes.includes(toVisit[i])) {
          listOfNodes.push(toVisit[i])
        }
      }

      debug('listOfNodes length', listOfNodes.map(_ => _.name))

      listOfNodes.sort((a, b) => {
        if (a.distance > b.distance) {
          return 1
        } else {
          return a.distance === b.distance ? 0 : -1
        }
      })
    }

    // if we reached the end of the list without finding a path
    return []
  }

  /**
   * Generates the path from an endNode to the startNode
   * it uses the `visitedFrom` property to navigate backwards
   * to the starting point
   * @param {Node} endNode
   * @returns {Node[]}
   */
  static generatePath (endNode) {
    const out = [endNode]
    let curr = endNode
    while (curr.visitedFrom) {
      out.unshift(curr.visitedFrom)
      curr = curr.visitedFrom
    }
    return out
  }

  /**
   * Print the path like a linked list
   * @param {Node[]} listOfNodes
   */
  /* istanbul ignore next */
  static printPath (listOfNodes) {
    let out = ''
    for (const n of listOfNodes) {
      out += `(${n.name}, ${n.distance}) => `
    }
    out += 'x'
    debug(out)
  }
}

module.exports = { Dijkstra, Path, Node }
