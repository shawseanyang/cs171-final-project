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
    
        // Update X axis
        vis.x.domain(vis.displayData.map(d => d.destinationAirport));
        const xAxisGroup = vis.svg.select(".x-axis")
            .attr("transform", `translate(0,${vis.height})`)
            .call(d3.axisBottom(vis.x));

        // Adjust x-axis labels if needed
        xAxisGroup.selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)");

        // Append x-axis label if not already appended
        if (xAxisGroup.selectAll(".axis-label").empty()) {
            xAxisGroup.append("text")
                .attr("class", "axis-label")
                .attr("x", vis.width / 2)
                .attr("y", 30) // Adjust as needed
                .style("text-anchor", "middle")
                .text("Destination Airport");
        }
    
        // Update Y axis to include both positive and negative values
        const yDomain = [
            d3.min(vis.displayData, d => d.moneySaved),
            d3.max(vis.displayData, d => d.moneySaved)
        ];
        vis.y.domain(yDomain).nice();

        // Set up the y-axis with explicit ticks
        const yAxis = d3.axisLeft(vis.y)
            .ticks(5) // Adjust the number of ticks as needed
            .tickFormat(d3.format(".2s")); // Format the ticks (e.g., as shortened numbers)

        vis.svg.select(".y-axis")
            .call(yAxis)
            .append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)") // Rotate the label for vertical axis
            .attr("x", -vis.height / 2) // Center the label
            .attr("y", -35) // Position to the left of the y-axis
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
            .attr("fill", d => d.moneySaved < 0 ? "red" : "#69b3a2");

        // Exit selection: Remove triangles that are no longer in the data
        triangles.exit().remove();

        if (vis.callback) {
            vis.callback(vis);
        }
    }
}