/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables
let vis1;
let vis2; 
let vis3;
let vis4;

// application state
let APPLICATION_STATE = {
    selectedCity: ''
}

// load data using promises
let promises = [
    d3.csv("data/onlyMay.csv"),
];

Promise.all(promises)
    .then(function (data) {
        initMainPage(data)
    })
    .catch(function (err) {
        console.log(err)
    });

function updateSelectedCity(city) {
    APPLICATION_STATE.selectedCity = city;
    vis1.wrangleData();
    vis2.wrangleData();
    vis3.wrangleData();
    vis4.wrangleData();
}

// initMainPage
function initMainPage(dataArray) {

    // log data
    console.log('check out the data', dataArray[0]);

    // Grab the set of cities
    let cities = new Set(dataArray[0].map(d => d.destinationAirport));

    // Remove the empty string
    cities.delete("");

    // Use the first city by default
    APPLICATION_STATE.selectedCity = cities.values().next().value;

    // Add the cities to the select menu
    let cityDropdown = d3.select("#city-select");
    cityDropdown.selectAll("option")
        .data(cities)
        .join("option")
        .attr("value", d => d)
        .attr("selected", d => d === APPLICATION_STATE.selectedCity ? "true" : null)
        .text(d => d);
    cityDropdown.on("change", function() {
        updateSelectedCity(this.value);
    });

    // init visualizations
    vis1 = new DaysPriorPriceVis('vis1', dataArray[0], (vis) => {
      // update title with the cheapest day to buy
      d3.select('#vis1-title')
        .text(`Buy your ticket ${vis.getCheapestDayToBuy()} days before your flight!`);
    });
    vis2 = new AirlineCostVis('vis2', dataArray[0], (vis) => {
        d3.select('#vis2-title')
            .text(`Fly with ${vis.getCheapestAirline()}!`);
    });
    vis3 = new CalendarVis('vis3', dataArray[0], (vis) => {
        // update title with cheapest week
        d3.select('#vis3-title')
            .text(`Fly on the ${vis.getCheapestWeek()}!`);
    });
    vis4 = new RateVis('vis4', dataArray[0], (vis) => {
        // update title with cheapest week
        d3.select('#vis4-title')
            .text(`On a vacation? Consider flying to ${vis.findBestValueDestination()}!`);
    });
    vis6 = new LayoverVis('vis6', dataArray[0], (vis) => {
        // update title with cheapest week
        d3.select('#vis6-title')
            .text(`Fly ${vis.getLayoverDecision()}!`);
    });
}