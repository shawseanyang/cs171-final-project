/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables
let vis3;
let vis4;

// application state
let APPLICATION_STATE = {
    selectedCity: 'ORD'
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

// initMainPage
function initMainPage(dataArray) {

    // log data
    console.log('check out the data', dataArray[0]);

    // init visualizations
    vis1 = new DaysPriorPriceVis('vis1', dataArray[0], (vis) => {
      // update title with the cheapest day to buy
      d3.select('#vis1-title')
        .text(`Buy your ticket ${vis.getCheapestDayToBuy()} days before your flight!`);
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
}