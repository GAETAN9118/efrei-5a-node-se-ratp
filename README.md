# RATP

## Load the database

* Get the RATP\_GTFS\_FULL file from [Offre de transport de la RATP -
GTFS](https://data.ratp.fr/explore/dataset/offre-transport-de-la-ratp-format-gtfs/information/)
* Unzip it to some location
* Load a mongodb server on your computer
* If needed, change the mongodb path in the params.js file
* To load the dataset in your mongodb instance, run the following command
```bash
DEBUG=ratp:* node tools/initDB.js --path path/to/your/files
```
Where `path/to/your/files` has to refer to the folder containing the .txt files
(agency.txt, routes.txt, ...)

This script can take between 10 minutes to 30 minutes to run, depending on your hardware
