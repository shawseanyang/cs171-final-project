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
    APPLICATION_STATE.selectedCity = city;
    vis1.wrangleData();
    vis2.wrangleData();
    vis3.wrangleData();
    vis4.wrangleData();
    vis5.wrangleData();
    vis6.wrangleData();
}

// Initialize the Intersection Observer
let observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.remove('vis-hidden');
            entry.target.classList.add('vis-visible');
            observer.unobserve(entry.target); // Stop observing this element after it's visible
        }
    });
}, { threshold: 0.7 }); // Adjust the threshold as needed

// Observe each visualization element
document.querySelectorAll('.tran').forEach(vis => {
    observer.observe(vis);
});

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

    initDropdown(cities);

    initVis(dataArray);

    hideLoadingScreen();

}

// Add the cities to the select menu
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
                console.log(value);
                // Update the dropdown display value
                document.getElementById('dropdown-display').textContent = value;
            }
    });
}

// Initializes visualizations
function initVis(dataArray){
    vis1 = new DaysPriorPriceVis('vis1', dataArray[0], (vis) => {
        // Update title with the cheapest day to buy
        d3.select('#vis1-title')
          .text(`Buy your ticket ${vis.getCheapestDayToBuy()} days before your flight!`);
      });
      vis2 = new AirlineCostVis('vis2', dataArray[0], (vis) => {
          d3.select('#vis2-title')
              .text(`Fly with ${vis.getCheapestAirline()}!`);
      });
      vis3 = new CalendarVis('vis3', dataArray[0], (vis) => {
          // Update title with cheapest week
          d3.select('#vis3-title')
              .text(`Fly on the ${vis.getCheapestWeek()}!`);
      });
      vis4 = new RateVis('vis4', dataArray[0], (vis) => {
          // Update title with cheapest destination
          d3.select('#vis4-title')
              .text(`On a vacation? Consider flying to ${vis.findBestValueDestination()}!`);
      });
      vis5 = new FareByDayVis('vis5', dataArray[0]);
      vis6 = new LayoverVis('vis6', dataArray[0], (vis) => {
          // Update title with layover suggestion
          d3.select('#vis6-title')
              .text(`Fly ${vis.getLayoverDecision()}!`);
      });
      vis7 = new BudgetMapVis('vis7', dataArray[0], dataArray[1]);
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loader-wrapper');
    loadingScreen.style.opacity = '0';

    loadingScreen.addEventListener('transitionend', function() {
        loadingScreen.style.display = 'none';
    }, { once: true });
}