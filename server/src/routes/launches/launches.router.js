const express = require("express");
const { httpGetAllLaunches, httpAddnewLaunch, httpAbortLaunch } = require("./launches.controller");

const launchRouter = express.Router();

launchRouter.get("/", httpGetAllLaunches);
launchRouter.post("/", httpAddnewLaunch);
launchRouter.delete("/:id", httpAbortLaunch);

module.exports = launchRouter;
