const axios = require("axios");
const launchesDatabase = require("./launches.mongo");
const planets = require("./planets.mongo");

const DEFAULT_FLIGHT_NUMBER = 100;

/*
const launches = new Map();

const launch = {
    flightNumber: 100, //flight_number
    mission: "Kepler Exploration X", //name
    rocket: "Explorer IS1", //rocket.name
    launchDate: new Date("December 27, 2030"), //date_local
    target: "Kepler-442 b", //not applicable
    customers: ["ZZTM", "NASA"], //payload.customers for each payload
    upcoming: true, //upcoming
    success: true, //success
};
saveLaunch(launch);
*/

const SPACEX_API_URL = "https://api.spacexdata.com/v4/launches/query";

async function populateLaunches() {
    console.log("Downloading launch date......");
    const response = await axios.post(SPACEX_API_URL, {
        quary: {},
        options: {
            pagination:false,
            populate: [
                {
                    path: "rocket",
                    select: {
                        name: 1,
                    },
                },
                {
                    path: "payloads",
                    select: {
                        customer: 1,
                    },
                },
            ],
        },
    });

    if(response.status !== 200){
        console.log("Problem downloading launch data");
        throw new Error("Launch data download failed")
    }

    const launchDocs = await response.data.docs;

    for (const launchDoc of launchDocs) {
        const payloads = launchDoc["payloads"];

        const customers = payloads.flatMap((payload) => {
            return payload["customers"];
        });
        const launch = {
            flightNumber: launchDoc["flight_number"],
            mission: launchDoc["name"],
            rocket: launchDoc["rocket"]["name"],
            launchDate: launchDoc["date_local"],
            upcoming: launchDoc["upcoming"],
            success: launchDoc["success"],
            customers,
        };

        console.log(`${launch.flightNumber} ${launch.mission} ${launch.customers}`, "hello");

        await saveLaunch(launch);
    }
}

async function loadLaunchData() {
    const firstLaunch = await findLaunch({
        flightNumber: 1,
        rocket: "Falcon 1",
        mission: "FalconSat",
    });

    if (firstLaunch) {
        console.log("Launch Data already loaded...");
        return;
    }else{
        await populateLaunches();
    }

}

async function findLaunch(filter) {
    return await launchesDatabase.findOne(filter);
}

async function existLaunchWithId(launchId) {
    // return launches.has(launchId);
    return await launchesDatabase.findOne({
        flightNumber: launchId,
    });
}

async function getLatestFlightNumber() {
    const latestLaunch = await launchesDatabase.findOne({}).sort("-flightNumber");

    // console.log(latestLaunch,"latest launch");

    if (!latestLaunch) {
        return DEFAULT_FLIGHT_NUMBER;
    }

    return latestLaunch.flightNumber;
}

async function getAllLaunches(skip, limit) {
    // return Array.from(launches.values());
    return await launchesDatabase.find({}, { _id: 0, __v: 0 })
    .sort({flightNumber:1})
    .skip(skip)
    .limit(limit);
}

async function saveLaunch(launch) {
    await launchesDatabase.findOneAndUpdate(
        {
            flightNumber: launch.flightNumber,
        },
        launch,
        {
            upsert: true,
        }
    );
}

async function scheduleNewLaunch(launch) {

    const planet = await planets.findOne({
        keplerName: launch.target,
    });

    if (!planet) {
        throw new Error("no matching planet found!");
    }


    const newFlightNumber = (await getLatestFlightNumber()) + 1;
    console.log(newFlightNumber, "new flight number");

    const newLaunch = Object.assign(launch, {
        success: true,
        upcoming: true,
        customers: ["milan", "NASA"],
        flightNumber: newFlightNumber,
    });

    await saveLaunch(newLaunch);
}

async function abortLauchById(launchId) {
    // const aborted = launches.get(launchId);
    // aborted.upcoming = false;
    // aborted.success = false;
    // return aborted;

    const aborted = await launchesDatabase.updateOne(
        {
            flightNumber: launchId,
        },
        {
            upcoming: false,
            success: false,
        }
    );

    return aborted.acknowledged == true && aborted.matchedCount === 1;
}

module.exports = {
    loadLaunchData,
    existLaunchWithId,
    getAllLaunches,
    scheduleNewLaunch,
    abortLauchById,
};
