const params = {
  DBPATH: 'mongodb://localhost:27017/ratp'
}

if (!params.DBPATH) {
  console.error('DBPATH is not defined in params.js')
  process.exit(1)
}

module.exports = params
