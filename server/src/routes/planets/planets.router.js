const express = require('express');

const { httpGetAllPlanets } = require("./planets.controller");
const planetRouter = express.Router();

//express.Router is another type of middleware that groups togather relateable routes 

planetRouter.get("/",httpGetAllPlanets);

module.exports = planetRouter;