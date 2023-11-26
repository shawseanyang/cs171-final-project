/* * * * * * * * * * * * * *
*      class rateVis       *
* * * * * * * * * * * * * */


class RateVis {

    constructor(parentElement, data, callback) {
        this.parentElement = parentElement;
        this.data = data.map(d => ({
            destinationAirport: d.destinationAirport,
            isNonStop: d.isNonStop === "True",
            totalFare: +d.totalFare,
            totalTravelDistance: +d.totalTravelDistance
        }));

        this.callback = callback;
  
        this.initVis();
    }

    findBestValueDestination() {
        return this.bestValueDestination;
    }

    createLineGenerator() {
        let vis = this;
        const { m, b } = vis.calculateRegressionParams(vis.displayData);
        return d3.line()
            .x(d => vis.x(d.averageFare))
            .y(d => vis.y(m * d.averageFare + b));
    }

    calculateRegressionParams(data) {
        const xMean = d3.mean(data, d => d.averageFare);
        const yMean = d3.mean(data, d => d.totalTravelDistance);
        const num = data.reduce((acc, d) => acc + (d.averageFare - xMean) * (d.totalTravelDistance - yMean), 0);
        const den = data.reduce((acc, d) => acc + Math.pow(d.averageFare - xMean, 2), 0);
        const m = num / den;
        const b = yMean - m * xMean;
        return { m, b };
    }

    drawArrowsToRegressionLine() {
        let vis = this;
        const { m, b } = vis.calculateRegressionParams(vis.displayData);

        // Create a linear scale for mapping arrow lengths to colors with the adjusted domain
        const maxArrowLength = d3.max(vis.displayData, d => vis.y(m * d.averageFare + b) - vis.y(d.totalTravelDistance));
        const maxDomainValue = maxArrowLength * 1.2; // You can adjust the factor (1.2) as needed
        const colorScale = d3.scaleSequential()
            .domain([0, maxDomainValue])
            .interpolator(d3.interpolateRdYlGn);
    
        vis.svg.selectAll(".regression-arrow")
            .data(vis.displayData)
            .enter()
            .append("line")
            .attr("class", "regression-arrow")
            .attr("x1", d => vis.x(d.averageFare))
            .attr("y1", d => vis.y(d.totalTravelDistance))
            .attr("x2", d => vis.x(d.averageFare))
            .attr("y2", d => vis.y(m * d.averageFare + b))
            .attr("stroke", d => colorScale(vis.y(m * d.averageFare + b) - vis.y(d.totalTravelDistance)))
            .attr("stroke-width", 3)
            .attr("stroke-opacity", 0.5)
            .attr("marker-end", "url(#arrow)");
    }
    

    initVis(){
        let vis = this;

        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate(${vis.margin.left},${vis.margin.top})`);

        // Init scales
        vis.x = d3.scaleLinear()
            .range([0, vis.width]);
        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);
        
        // Init axes
        vis.xAxis = d3.axisBottom(vis.x);
        vis.yAxis = d3.axisLeft(vis.y);
        
        // Add X-axis group
        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr('transform', `translate(${vis.margin.left}, ${vis.height})`);

        // Add Y-axis group
        vis.svg.append("g")
            .attr("class", "y-axis axis");


            
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

    wrangleData() {
        let vis = this;
    
        // Initialize variables to track the best value destination
        let bestValueDestination = null;
        let highestRatio = 0;
    
        // Process data to group by destination and find the best value destination
        const processedData = d3.rollup(vis.data, 
            (v) => {
                // Find a nonstop flight for each destination
                const nonstopFlight = v.find(f => f.isNonStop);
                const nonstopDistance = nonstopFlight ? nonstopFlight.totalTravelDistance : 3113;
    
                // Calculate the average fare for each destination
                const averageFare = d3.mean(v, f => f.totalFare);
    
                // Calculate the ratio of distance to fare
                const ratio = nonstopDistance / averageFare;
    
                // Update the best value destination if this ratio is higher
                if (ratio > highestRatio) {
                    highestRatio = ratio;
                    bestValueDestination = nonstopFlight ? nonstopFlight.destinationAirport : null;
                }
    
                return {
                    totalTravelDistance: nonstopDistance,
                    averageFare: averageFare
                };
            },
            d => d.destinationAirport // Grouping key is now only destination
        );
    
        vis.displayData = Array.from(processedData, ([destination, values]) => ({ destination, ...values }));
    
        // Store the best value destination in the instance for later use
        vis.bestValueDestination = bestValueDestination;
    
        vis.updateVis();
    }

    updateVis(){
        let vis = this;
    
        // Update scales
        vis.x.domain([0, d3.max(vis.displayData, d => d.averageFare)]);
        vis.y.domain([0, d3.max(vis.displayData, d => d.totalTravelDistance + 500)]);
    
        // Update axes
        vis.svg.select(".x-axis").call(vis.xAxis);
        vis.svg.select(".y-axis").attr("transform", `translate(${vis.margin.left}, 0)`).call(vis.yAxis);
        
        // Draw arrows to regression line
        vis.drawArrowsToRegressionLine();

        vis.svg.selectAll(".regression-arrow")
            .on("mouseover", (event, d) => {
                vis.tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                vis.tooltip.html(`Destination: ${d.destination}<br>Average Fare: ${d.averageFare}<br>Total Travel Distance: ${d.totalTravelDistance}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                vis.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Draw circles for scatter plot
        let circles = vis.svg.selectAll("circle")
            .data(vis.displayData);
    
        circles.enter()
            .append("circle")
            .merge(circles)
            .attr("cx", d => vis.x(d.averageFare))
            .attr("cy", d => vis.y(d.totalTravelDistance))
            .attr("r", 5)
            .attr("fill", "grey");
        
        circles.on("mouseover", (event, d) => {
            console.log("mouseover", d);
            vis.tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            vis.tooltip.html(`Destination: ${d.destination}<br>Average Fare: ${d.averageFare}<br>Total Travel Distance: ${d.totalTravelDistance}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            vis.tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
    
        circles.exit().remove();

        // Draw regression line
        const lineGenerator = vis.createLineGenerator();
        const lineData = [{ averageFare: d3.min(vis.displayData, d => d.averageFare) }, { averageFare: d3.max(vis.displayData, d => d.averageFare) }];
        
        vis.svg.append("path")
            .datum(lineData)
            .attr("class", "regression-line")
            .attr("d", lineGenerator)
            .style("stroke", "grey")
            .style("stroke-width", 2);

        vis.callback(vis);
    }
}