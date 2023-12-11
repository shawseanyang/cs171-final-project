/* * * * * * * * * * * * * *
* class DaysPriorPriceVis  *
* * * * * * * * * * * * * */

class DaysPriorPriceVis {

    constructor(parentElement, data, callback) {
        this.parentElement = parentElement;
        this.data = data;
        this.callback = callback;

        // parse date method
        this.parseDate = d3.timeParse("%Y-%m-%d");

        this.initVis();
    }

    getCheapestDayToBuy() {
        let msg = this.cheapestDayToBuy;
        return `${msg} days`;
    }

    initVis(){
        let vis = this;

        vis.margin = {top: 20, right: 50, bottom: 50, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().width * 0.6 - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // init scales
        vis.x = d3.scaleLinear()
            .range([vis.width, 0]);
        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);
        vis.colorScale = d3.scaleSequential()
            .interpolator(d3.interpolateRdYlGn);
        
        // init axes
        vis.xAxis = vis.svg.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", `translate(0, ${vis.height})`);
            
        vis.yAxis = vis.svg.append("g")
            .attr("class", "axis axis--y")
            .attr("transform", `translate(${vis.width}, 0)`);

        // draw axis labels
        vis.svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", `translate(${vis.width / 2}, ${vis.height + 40})`)
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Days Prior to Flight");
        
        vis.svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", `translate(${vis.width + 40}, ${vis.height / 2}) rotate(90)`)
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Average Fare");


        // init tooltip with a rounded white background
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("font-weight", "bold")
            .style("font-size", "12px")
            .style("background-color", "black")
            .style("border-radius", "5px")
            .style("color", "white")
            .style("padding", "5px")
            .style("opacity", 0);

        this.wrangleData();
    }

    // for each city, for each number of days before flight, calculate average price
    wrangleData(){
        let vis = this

        // Filter by selected city
        const onlySelectedCity = vis.data.filter(d => d.destinationAirport == APPLICATION_STATE.selectedCity);

        // Add a new column for days prior to flight
        onlySelectedCity.forEach(function(d) {
            const flightDate = vis.parseDate(d.flightDate);
            const searchDate = vis.parseDate(d.searchDate);
            d.daysPrior = (flightDate - searchDate) / (1000 * 60 * 60 * 24);
        });

        // Group by prices by days prior
        const groupedByDaysPrior = d3.group(onlySelectedCity, d => d.daysPrior);

        // Calculate average price for each days prior
        const averagePriceByDaysPriorMap = new Map();
        groupedByDaysPrior.forEach((d,i) => {
            const average = d3.mean(d, d => d.totalFare);
            averagePriceByDaysPriorMap.set(i, average);
        });

        // Turn into a sorted array
        vis.averagePriceByDaysPrior = [...averagePriceByDaysPriorMap.entries()].sort((a, b) => a[0] - b[0]);

        // Calculate the cheapest day to buy
        vis.cheapestDayToBuy = vis.averagePriceByDaysPrior[d3.minIndex(vis.averagePriceByDaysPrior, d => d[1])][0];
        
        vis.updateVis()
    }

    updateVis(){
        let vis = this;

        // Update scales
        vis.x.domain([0, d3.max(vis.averagePriceByDaysPrior, d => d[0])]);
        vis.y.domain([d3.min(vis.averagePriceByDaysPrior, d => d[1]) - 20, d3.max(vis.averagePriceByDaysPrior, d => d[1]) + 20]);
        vis.colorScale.domain([d3.max(vis.averagePriceByDaysPrior, d => d[1]), 0]);

        // Update axes
        vis.xAxis.transition().duration(800).call(d3.axisBottom(vis.x));
        vis.yAxis.transition().duration(800).call(d3.axisRight(vis.y));

        // Draw the line
        vis.svg.selectAll("path").remove();
        vis.svg.append("path")
            .datum(vis.averagePriceByDaysPrior)
            .attr("fill", "none")
            .attr("stroke", "lightgray")
            .attr("stroke-width", 3)
            .attr("d", 
                d3.line()
                  .x(d => vis.x(d[0]))
                  .y(d => vis.y(d[1])));

        // Draw circles
        vis.svg.selectAll("circle")
            .data(vis.averagePriceByDaysPrior, d => d[0])
            .join("circle")
            .attr("cx", d => vis.x(d[0]))
            .attr("cy", d => vis.y(d[1]))
            .attr("r", 10)
            .attr("fill", d => vis.colorScale(d[1]))
            .attr("stroke", "white")
            .raise()
            .on("mouseover", (event, d) => {
                vis.tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                vis.tooltip.html(`Days Prior: ${d[0]}<br>Average Fare: ${
                  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(d[1])
                }`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                vis.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .exit().remove();

            // Call the callback function
            vis.callback(vis);
    }
}