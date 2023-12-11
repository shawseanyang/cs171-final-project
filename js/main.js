/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables
let vis1;
let vis2; 
let vis3;
let vis4;
let vis5;
let vis6;

// application state
let APPLICATION_STATE = {
    selectedCity: ''
}

// load data using promises
let promises = [
    d3.csv("data/onlyMay.csv"),
    d3.csv("data/airports.csv")
];

Promise.all(promises)
    .then(function (data) {
        initMainPage(data)
    })
    .catch(function (err) {
        console.log(err)
    });

function updateSelectedCity(city) {
    showLoadingScreen();
    APPLICATION_STATE.selectedCity = city;
    console.log("logging in mainjs", APPLICATION_STATE.selectedCity);
    if (vis1 && vis2 && vis3 && vis4 && vis5 && vis6) {
        vis1.wrangleData();
        vis2.wrangleData();
        vis3.wrangleData();
        vis4.wrangleData();
        vis5.wrangleData();
        vis6.wrangleData();
    }
    hideLoadingScreen();
}

// initMainPage
function initMainPage(dataArray) {

    // log data
    console.log('check out the data', dataArray[0]);

    // Grab the set of cities
    let cities = new Set(dataArray[0].map(d => d.destinationAirport));

    // Remove the empty string
    cities.delete("");

    initDropdown(cities, updateSelectedCity);

    initVis(dataArray);

    hideLoadingScreen();

}

function initDropdown(cities) {
    let cityDropdownMenu = d3.select("#city-select .menu");

    cityDropdownMenu.selectAll("div.item")
        .data(cities)
        .join("div")
        .attr("class", "item")
        .attr("data-value", d => d)
        .text(d => d);

    $('#city-select').dropdown({
        onChange: function(value) {
            // Update the APPLICATION_STATE
            updateSelectedCity(value);
            // Update the dropdown display value
            document.getElementById('dropdown-display').textContent = value;
        }
    });

    // Set the default value to ATL
    $('#city-select').dropdown('set selected', 'ATL');
}

// Initializes visualizations
function initVis(dataArray){
    vis4 = new RateVis('vis4', dataArray[0], (vis) => {
        // Update title with cheapest destination
        d3.select('#vis4-title')
            .text(`${vis.getTitle()}`);
        d3.select('#vis4-avg-ratio')
            .text(`${vis.getAvgRatio()}`)
        d3.select('#vis4-city')
            .text(`${APPLICATION_STATE.selectedCity}`)
        d3.select('#vis4-city-price')
            .text(`${vis.getCityRatio()}`)
        d3.select('#vis4-best-city')
            .text(`${vis.getBestValueDestination()}`)
    });
    vis1 = new DaysPriorPriceVis('vis1', dataArray[0], (vis) => {
        // Update title with the cheapest day to buy
        d3.select('#vis1-title')
            .text(`Buy your ticket ${vis.getCheapestDayToBuy()} before your flight!`);
        d3.select('#vis1-best-day')
            .text(`${vis.getCheapestDayToBuy()}`)
    });
    vis2 = new AirlineCostVis('vis2', dataArray[0], (vis) => {
        d3.select('#vis2-title')
            .text(`Fly with ${vis.getCheapestAirline()}!`);
        d3.select('#vis2-city')
            .text(`${APPLICATION_STATE.selectedCity}`)
        d3.select('#vis2-airline')
            .text(`${vis.getCheapestAirline()}`)
    });
    vis3 = new CalendarVis('vis3', dataArray[0], (vis) => {
        // Update title with cheapest week
        d3.select('#vis3-title')
            .text(`Fly on the ${vis.getCheapestWeek()}!`);
    });
    vis5 = new FareByDayVis('vis5', dataArray[0], (vis) => {
        d3.select('#vis5-title')
            .text("Which day is the best, based on my airline?");
    });
    vis6 = new LayoverVis('vis6', dataArray[0], (vis) => {
        // Update title with layover suggestion
        d3.select('#vis6-title')
            .text(`Fly ${vis.getLayoverDecision()}!`);
        d3.select('#vis6-bad-cities')
            .text(`${vis.getBadCities()}`);
        d3.select('#vis6-best-city')
            .text(`${vis.getCityWithMostSavings()}`)
        d3.select('#vis6-best-savings')
            .text(`${vis.getMostSavingsAmount()}`)
    });
    vis7 = new BudgetMapVis('vis7', dataArray[0], dataArray[1]);
}

function showLoadingScreen() {
    const loadingScreen = document.getElementById('loader-wrapper');
    loadingScreen.style.display = 'flex';
    loadingScreen.style.opacity = '1';
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loader-wrapper');
    loadingScreen.style.opacity = '0';

    loadingScreen.addEventListener('transitionend', function() {
        loadingScreen.style.display = 'none';
    }, { once: true });
}