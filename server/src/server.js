const http = require('http');
const app = require("./app");
require("dotenv").config();

const { loadPlanetsData } = require("./models/planets.model");
const { loadLaunchData } = require("./models/launches.model")
const { mongoConnect } = require('./services/mongo');


const server = http.createServer(app)

const PORT = process.env.PORT || 8000;


async function startServer() {
    await mongoConnect();
    await loadPlanetsData();
    await loadLaunchData();

    server.listen(PORT, () => {
        console.log(`Listning on port ${PORT}...`)
    });
}

startServer();