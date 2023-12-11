/* * * * * * * * * * * * * *
*      class LayoverVis        *
* * * * * * * * * * * * * */


class LayoverVis {

    constructor(parentElement, data, callback) {
      this.parentElement = parentElement;
      this.data = data.map(d => ({
        destinationAirport: d.destinationAirport,
        isNonStop: d.isNonStop === "True",
        totalFare: +d.totalFare,
        }));
      this.callback = callback;

      this.initVis();
    }

    getLayoverDecision() {
        console.log(this.layoverDecision)
        return this.layoverDecision
    }

    getCityWithMostSavings() {
        return this.cityWithMostSavings;
    }

    getMostSavingsAmount() {
        let msg = Number(this.mostSavingsAmount.toFixed(2));
        return `\$${msg}`;
    }

    getBadCities() {
        let data = this.badCities;
        return data.join(", ");
    }

    initVis(){
        let vis = this;

        vis.margin = {top: 20, right: 0, bottom: 40, left: 50};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        // Same as width but apply the top and bottom margins.
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().width * 0.6 - vis.margin.top - vis.margin.bottom;

        // Cell size is the width of the calendar divided by 7 days in a week
        vis.cellSize = vis.width / 7;

        // init graph area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // Initialize X axis
        vis.x = d3.scaleBand()
            .range([0, vis.width])
            .padding(0.2);
        vis.svg.append("g")
            .attr("transform", `translate(0,${vis.height})`)
            .attr("class", "x-axis");

        // Initialize Y axis
        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);
        vis.svg.append("g")
            .attr("class", "y-axis");

        // Initialize tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px");

        this.wrangleData();
    }

    wrangleData(){
        let vis = this;
    
        // Calculate the difference between average fares for nonstop and not nonstop flights for each destination city
        let moneySavedCalculations = d3.rollups(
            vis.data, 
            flights => {
                const avgNonstop = d3.mean(flights.filter(f => f.isNonStop), f => f.totalFare);
                const avgNotNonstop = d3.mean(flights.filter(f => !f.isNonStop), f => f.totalFare);
    
                // Check if both averages are defined
                if (avgNonstop !== undefined && avgNotNonstop !== undefined) {
                    return avgNotNonstop - avgNonstop; // Assuming nonstop flights are cheaper
                } 

            },
            flight => flight.destinationAirport
        );
    
    // Filter out undefined values and prepare the data for the bar chart
    vis.displayData = moneySavedCalculations
        .filter(([_, moneySaved]) => moneySaved !== undefined)
        .map(([destinationAirport, moneySaved]) => ({
            destinationAirport: destinationAirport,
            moneySaved: moneySaved
        }))
        .sort((a, b) => b.moneySaved - a.moneySaved); // Sort from biggest to least moneySaved

    // Save the city with the most savings and the amount of savings
    if (vis.displayData.length > 0) {
        vis.cityWithMostSavings = vis.displayData[0].destinationAirport;
        vis.mostSavingsAmount = vis.displayData[0].moneySaved;
    }

    // Save cities where moneySaved < 0 to an array
    vis.badCities = vis.displayData
        .filter(d => d.moneySaved < 0)
        .map(d => d.destinationAirport);

    // Find the money saved for APPLICATION_STATE.selectedCity
    const selectedCityData = vis.displayData.find(d => d.destinationAirport === APPLICATION_STATE.selectedCity);

    // Set layoverDecision based on the money saved for the selected city
    if (selectedCityData && selectedCityData.moneySaved > 0) {
        vis.layoverDecision = "with layovers";
    } else {
        vis.layoverDecision = "without layovers";
    }

    vis.updateVis();
}

    updateVis(){
        let vis = this;

        // Define the minimum and maximum values for moneySaved
        const minMoneySaved = d3.min(vis.displayData, d => d.moneySaved);
        const maxMoneySaved = d3.max(vis.displayData, d => d.moneySaved);

        // Define a linear color scale for the gradient
        const colorScale = d3.scaleLinear()
            .domain([minMoneySaved, 0, maxMoneySaved])
            .range(["red", "yellow", "green"]);
    
        // Update X axis
        vis.x.domain(vis.displayData.map(d => d.destinationAirport));
        const xAxisGroup = vis.svg.select(".x-axis")
        .call(d3.axisBottom(vis.x));

        // Append or Update X-Axis Label
        let xAxisLabel = vis.svg.selectAll(".axis-label.x").data([0]);
        xAxisLabel.enter().append("text")
            .merge(xAxisLabel) // Merge for updating
            .attr("class", "axis-label x")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + 30) // Adjust this value as needed
            .style("text-anchor", "middle")
            .text("Destination Airport");

        // Append x-axis label if not already appended
     

        // Update Y axis
        const yDomain = [
            d3.min(vis.displayData, d => d.moneySaved),
            d3.max(vis.displayData, d => d.moneySaved)
        ];
        vis.y.domain(yDomain).nice();
        const yAxis = d3.axisLeft(vis.y)
            .ticks(5) // Adjust the number of ticks as needed
            .tickFormat(d3.format(".2s")); // Format the ticks (e.g., as shortened numbers)

            const yAxisGroup = vis.svg.select(".y-axis").call(d3.axisLeft(vis.y));

            // Append or Update Y-Axis Label
            let yAxisLabel = vis.svg.selectAll(".axis-label.y").data([0]);
            yAxisLabel.enter().append("text")
                .merge(yAxisLabel) // Merge for updating
                .attr("class", "axis-label y")
                .attr("transform", "rotate(-90)") // Rotate label for Y Axis
                .attr("x", -vis.height / 2)
                .attr("y", -40) // Adjust this value as needed
                .style("text-anchor", "middle")
                .text("Average Money Saved Flying Nonstop");
        
    
        // Define a function to create a triangle polygon
        const trianglePath = (d) => {
            const xCenter = vis.x(d.destinationAirport) + vis.x.bandwidth() / 2;
            const yBase = vis.y(0); // Y-coordinate for the x-axis (moneySaved = 0)
            const yTip = vis.y(d.moneySaved); // Y-coordinate for the value of moneySaved
            const triangleWidth = vis.x.bandwidth() / 2; // Width of the triangle base

            // Calculate points for the triangle
            const points = [
                [xCenter, yTip], // Tip of the triangle
                [xCenter - triangleWidth / 2, yBase], // Left base
                [xCenter + triangleWidth / 2, yBase] // Right base
            ];

            return points.map(point => point.join(',')).join(' ');
        };

        // Bind data to the triangles
        const triangles = vis.svg.selectAll(".triangle")
            .data(vis.displayData, d => d.destinationAirport);

        // Enter and update triangles
        triangles.enter()
            .append("polygon")
            .merge(triangles) // Merge enter and update selections
            .transition()
            .duration(1000)
            .attr("class", "triangle")
            .attr("points", trianglePath)
            .attr("fill", d => colorScale(d.moneySaved));

        // Exit selection: Remove triangles that are no longer in the data
        triangles.exit().remove();

        if (vis.callback) {
            vis.callback(vis);
        }
    }
}
