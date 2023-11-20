/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables
let vis3;

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
    vis3 = new CalendarVis('vis3', dataArray[0], (vis) => {
        // update title with cheapest week
        d3.select('#vis3-title')
            .text(`Fly on the ${vis.getCheapestWeek()}!`);
    });
}