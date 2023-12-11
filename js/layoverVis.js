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

        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().width * 0.6 - vis.margin.top - vis.margin.bottom;

        // 7 days in a week !
        vis.cellSize = vis.width / 7;


        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        vis.x = d3.scaleBand()
            .range([0, vis.width])
            .padding(0.2);
        vis.svg.append("g")
            .attr("transform", `translate(0,${vis.height})`)
            .attr("class", "x-axis");

        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);
        vis.svg.append("g")
            .attr("class", "y-axis");

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
    

                if (avgNonstop !== undefined && avgNotNonstop !== undefined) {
                    return avgNotNonstop - avgNonstop; 
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
        .sort((a, b) => b.moneySaved - a.moneySaved);

    // Save the city with the most savings and the amount of savings
    if (vis.displayData.length > 0) {
        vis.cityWithMostSavings = vis.displayData[0].destinationAirport;
        vis.mostSavingsAmount = vis.displayData[0].moneySaved;
    }

    // Save cities where moneySaved < 0 to an array
    vis.badCities = vis.displayData
        .filter(d => d.moneySaved < 0)
        .map(d => d.destinationAirport);

  
    const selectedCityData = vis.displayData.find(d => d.destinationAirport === APPLICATION_STATE.selectedCity);

    
    if (selectedCityData && selectedCityData.moneySaved > 0) {
        vis.layoverDecision = "with layovers";
    } else {
        vis.layoverDecision = "without layovers";
    }

    vis.updateVis();
}

    updateVis(){
        let vis = this;
    

        vis.x.domain(vis.displayData.map(d => d.destinationAirport));
        const xAxisGroup = vis.svg.select(".x-axis")
        .call(d3.axisBottom(vis.x));

       
        let xAxisLabel = vis.svg.selectAll(".axis-label.x").data([0]);
        xAxisLabel.enter().append("text")
            .merge(xAxisLabel) 
            .attr("class", "axis-label x")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + 30)
            .style("text-anchor", "middle")
            .text("Destination Airport");

        const yDomain = [
            d3.min(vis.displayData, d => d.moneySaved),
            d3.max(vis.displayData, d => d.moneySaved)
        ];
        vis.y.domain(yDomain).nice();
        const yAxis = d3.axisLeft(vis.y)
            .ticks(5) 
            .tickFormat(d3.format(".2s")); 

            const yAxisGroup = vis.svg.select(".y-axis").call(d3.axisLeft(vis.y));

           
            let yAxisLabel = vis.svg.selectAll(".axis-label.y").data([0]);
            yAxisLabel.enter().append("text")
                .merge(yAxisLabel) 
                .attr("class", "axis-label y")
                .attr("transform", "rotate(-90)")
                .attr("x", -vis.height / 2)
                .attr("y", -40) 
                .style("text-anchor", "middle")
                .text("Average Money Saved Flying Nonstop");
        
    

        const trianglePath = (d) => {
            const xCenter = vis.x(d.destinationAirport) + vis.x.bandwidth() / 2;
            const yBase = vis.y(0);
            const yTip = vis.y(d.moneySaved); 
            const triangleWidth = vis.x.bandwidth() / 2;

            // Calculate points for the triangle
            const points = [
                [xCenter, yTip], 
                [xCenter - triangleWidth / 2, yBase],
                [xCenter + triangleWidth / 2, yBase] 
            ];

            return points.map(point => point.join(',')).join(' ');
        };

        // Bind data to the triangles
        const triangles = vis.svg.selectAll(".triangle")
            .data(vis.displayData, d => d.destinationAirport);

        // Enter and update triangles
        triangles.enter()
            .append("polygon")
            .merge(triangles) 
            .transition()
            .duration(1000)
            .attr("class", "triangle")
            .attr("points", trianglePath)
            .attr("fill", d => d.moneySaved < 0 ? "red" : "#69b3a2");

        triangles.exit().remove();

        if (vis.callback) {
            vis.callback(vis);
        }
    }
}