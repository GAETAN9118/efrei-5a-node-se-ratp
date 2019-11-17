const csvParser = require('csv-parser')
const fs = require('fs')

/**
 * @param {String} filePath
 * @param {Function} save
 * @param {Number} [batchSize=10000]
 */
async function importCSV (filePath, save, batchSize=10000) {
  return new Promise((resolve, reject) => {
    let counter = 1
    const tmp = []
    const stream = fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', async (data) => {
        try {
          if (tmp.length < batchSize) {
            tmp.push(data)
            return
          }
          stream.pause()
          await save(tmp, counter++)
          tmp.length = 0
          stream.resume()
        } catch (err) {
          stream.destroy()
          reject(err)
        }
      })
      .on('end', async () => {
        if (tmp.length < 10000 && tmp.length > 0) {
          await save(tmp, counter++)
        }
        resolve()
      })
  })
}

module.exports = importCSV
