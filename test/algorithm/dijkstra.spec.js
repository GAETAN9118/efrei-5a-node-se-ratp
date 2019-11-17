/* eslint-disable no-unused-expressions */
const sinon = require('sinon')
sinon.test = require('sinon-test')(sinon)
const { expect } = require('chai')
const { Dijkstra, Node } = require('../../algorithm/dijkstra.js')

function n (name) {
  return new Node(name)
}
/**
 * Please look at the [fixture-graph.odg](fixture-graph.odg) to understand the links
 * [Test Fixtures](https://github.com/junit-team/junit4/wiki/Test-fixtures)
 *
 * @returns {{ startNode: Node, endNode: Node, nodes: Node[][] }}
 */
function fixtureGenerator () {
  const nodes = [
    [n('1x1'), n('1x2'), n('1x3')],
    [n('2x1'), n('2x2'), n('2x3')],
    [n('3x1'), n('3x2'), n('3x3')]
  ]

  nodes[0][0].addNonOrientedPath(nodes[0][1], async () => 1)
  nodes[0][0].addNonOrientedPath(nodes[1][0], async () => 1)
  nodes[0][0].addNonOrientedPath(nodes[1][1], async () => 4)

  nodes[0][1].addNonOrientedPath(nodes[0][2], async () => 2)
  nodes[0][1].addNonOrientedPath(nodes[1][1], async () => 4)
  nodes[0][1].addNonOrientedPath(nodes[1][0], async () => 8)
  nodes[0][1].addNonOrientedPath(nodes[1][2], async () => 4)

  nodes[0][2].addNonOrientedPath(nodes[1][1], async () => 7)
  nodes[0][2].addNonOrientedPath(nodes[1][2], async () => 2)

  nodes[1][0].addNonOrientedPath(nodes[2][0], async () => 2)
  nodes[1][0].addNonOrientedPath(nodes[1][1], async () => 1)
  nodes[1][0].addNonOrientedPath(nodes[2][1], async () => 2)

  nodes[1][1].addNonOrientedPath(nodes[2][0], async () => 4)
  nodes[1][1].addNonOrientedPath(nodes[2][1], async () => 4)
  nodes[1][1].addNonOrientedPath(nodes[2][2], async () => 2)
  nodes[1][1].addNonOrientedPath(nodes[1][2], async () => 1)

  nodes[1][2].addNonOrientedPath(nodes[2][1], async () => 5)
  nodes[1][2].addNonOrientedPath(nodes[2][2], async () => 0)

  nodes[2][1].addNonOrientedPath(nodes[2][0], async () => 2)
  nodes[2][1].addNonOrientedPath(nodes[2][2], async () => 3)

  const startNode = nodes[0][1]
  const endNode = nodes[2][2]

  return { startNode, endNode, nodes }
}

describe('Node', () => {
  describe('#calcNeighboursTentativeDistance', () => {
    it('should not update visited neighbours', sinon.test(async function () {
      const curr = new Node('current')
      const visited = new Node('visited')
      const notVisited = new Node('not-visited')

      curr.distance = 1

      curr.addNonOrientedPath(visited, () => 1)
      visited.visited = true
      visited.distance = 10

      curr.addNonOrientedPath(notVisited, () => 2)
      notVisited.visited = false
      notVisited.distance = 2

      await curr.calcNeighboursTentativeDistance()

      expect(visited.distance).to.equal(10)
    }))

    it('should update not-visited neighbours which current distance is higher than the newly calculated one', sinon.test(async function () {
      const curr = new Node('current')
      const visited = new Node('visited')
      const notVisited = new Node('not-visited')

      curr.distance = 1

      curr.addNonOrientedPath(visited, async () => 1)
      visited.visited = true
      visited.distance = 10

      curr.addNonOrientedPath(notVisited, async () => 2)
      notVisited.visited = false
      notVisited.distance = 5

      await curr.calcNeighboursTentativeDistance()

      expect(notVisited.distance).to.equal(curr.distance + 2)
    }))

    it('should not update not-visited neighbours if their currently calculated distance is lower than the newly calculated one', sinon.test(async function () {
      const curr = new Node('current')
      const visited = new Node('visited')
      const notVisited = new Node('not-visited')

      curr.distance = 1
      curr.addNonOrientedPath(visited, async () => 1)
      visited.visited = true
      visited.distance = 10

      curr.addNonOrientedPath(notVisited, async () => 2)
      notVisited.visited = false
      notVisited.distance = 2

      await curr.calcNeighboursTentativeDistance()

      expect(notVisited.distance).to.equal(2)
    }))

    it("should be able to update all necessary nodes' distances, not only the first found", sinon.test(async function () {
      const curr = new Node('current')
      const visited = new Node('visited')
      const notVisited = new Node('not-visited')
      const notVisited2 = new Node('not-visited2')

      curr.distance = 1

      curr.addNonOrientedPath(visited, async () => 1)
      visited.visited = true
      visited.distance = 10

      curr.addNonOrientedPath(notVisited, async () => 2)
      notVisited.visited = false
      notVisited.distance = Infinity

      curr.addNonOrientedPath(notVisited2, async () => 3)
      notVisited2.visited = false
      notVisited2.distance = Infinity

      await curr.calcNeighboursTentativeDistance()

      expect(notVisited.distance).to.equal(3)
      expect(notVisited2.distance).to.equal(4)
    }))

    it('should return the list of all unvisited nodes that were previously marked at a Infinity distance', sinon.test(async function () {
      const curr = new Node('current')
      const visited = new Node('visited')
      const notVisited = new Node('not-visited')
      const notVisited2 = new Node('not-visited2')
      const notVisited3 = new Node('not-visited3')

      curr.distance = 1

      curr.addNonOrientedPath(visited, async () => 1)
      visited.visited = true
      visited.distance = 10

      curr.addNonOrientedPath(notVisited, async () => 2)
      notVisited.visited = false
      notVisited.distance = Infinity

      curr.addNonOrientedPath(notVisited2, async () => 3)
      notVisited2.visited = false
      notVisited2.distance = Infinity

      curr.addNonOrientedPath(notVisited3, async () => 3)
      notVisited3.visited = false
      notVisited3.distance = 5

      const toVisit = await curr.calcNeighboursTentativeDistance()

      expect(toVisit).to.include.members([notVisited, notVisited2])
      expect(toVisit).to.not.have.members([notVisited3])
    }))
  })
})

describe('Dijkstra', () => {
  describe('#shortestPath', () => {
    it('should return an empty array if startNode === endNode', sinon.test(async function () {
      const { nodes } = fixtureGenerator()

      const result = await Dijkstra.shortestPathFirst(nodes[0][0], nodes[0][0])
      expect(result).to.be.an('array').that.is.empty
    }))

    it('should find the shortest path between two specified nodes', sinon.test(async function () {
      const { startNode, endNode, nodes } = fixtureGenerator()

      const result = await Dijkstra.shortestPathFirst(startNode, endNode)
      // Dijkstra.printPath(result)

      expect(result).to.be.an('array').of.length(3)
      expect(result[0].name).to.equal(startNode.name)
      expect(result[1].name).to.equal(nodes[1][2].name)
      expect(result[2].name).to.equal(endNode.name)
    }))
  })

  describe('#generatePath', () => {
    it('should return an array of nodes, following the right path', sinon.test(function () {
      const endNode = new Node('end')
      const intermediateNodes = [new Node('1'), new Node('2'), new Node('3')]
      const startNode = new Node('start')

      endNode.visitedFrom = intermediateNodes[0]
      intermediateNodes[0].visitedFrom = intermediateNodes[1]
      intermediateNodes[1].visitedFrom = intermediateNodes[2]
      intermediateNodes[2].visitedFrom = startNode

      const result = Dijkstra.generatePath(endNode)

      expect(result).to.be.an('array').that.eqls([
        startNode,
        intermediateNodes[2],
        intermediateNodes[1],
        intermediateNodes[0],
        endNode
      ])
    }))
  })
})
