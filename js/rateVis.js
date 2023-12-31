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

    getTitle() {
        return this.msg;
    }

    getVisFourText() {
        d3.select
        text = "On average, it costs The average cost per mile for " + APPLICATION_STATE.selectedCity + " is $" + this.applicationStateTopPercentage.toFixed(2) + " per mile. "
    }

    getBestValueDestination() {
        return this.bestValueDestination;
    }

    getAvgRatio() {
        let msg = Number(this.averageRatio.toFixed(2));
        return `\$${msg} per mile`;
    }
    
    getCityRatio() {
        let msg = Number(this.applicationStateRatio.toFixed(2));
        return `\$${msg} per mile`;
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
        const maxDomainValue = maxArrowLength * 1.2; 
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

        vis.margin = {top: 20, right: 20, bottom: 40, left: 40};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().width * 0.6 - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate(${vis.margin.left},${vis.margin.top})`);


        vis.x = d3.scaleLinear()
            .range([0, vis.width]);
        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);
        
  
        vis.xAxis = d3.axisBottom(vis.x);
        vis.yAxis = d3.axisLeft(vis.y);

        vis.svg.append("text")
            .attr("class", "x label")
            .attr("text-anchor", "end")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + 30)
            .text("Average Fare ($)");

  
        vis.svg.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", -vis.margin.left + 10)
            .attr("dy", ".75em")
            .attr("x", -vis.height / 2)
            .text("Total Travel Distance (miles)");
        

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr('transform', `translate(${vis.margin.left}, ${vis.height})`);


        vis.svg.append("g")
            .attr("class", "y-axis axis");

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
    
       
        let bestValueDestination = null;
        let highestRatio = 0;
        let totalRatioSum = 0; 
        let destinationsCount = 0; 

     
        const processedData = d3.rollup(vis.data, 
            (v) => {
                const nonstopFlight = v.find(f => f.isNonStop);
                if (nonstopFlight) {
                    const nonstopDistance = nonstopFlight.totalTravelDistance;

                    const averageFare = d3.mean(v, f => f.totalFare);
        
                    const ratio = nonstopDistance / averageFare;

                    if (ratio > highestRatio) {
                        highestRatio = ratio;
                        bestValueDestination = nonstopFlight.destinationAirport;
                    }

                    totalRatioSum += ratio;
                    destinationsCount++;

                    return {
                        totalTravelDistance: nonstopDistance,
                        averageFare: averageFare,
                        ratio: ratio
                    };
                }
                
                return undefined;
            },
            d => d.destinationAirport // Grouping key is now only destination
        );

    
        vis.averageRatio = destinationsCount > 0 ? totalRatioSum / destinationsCount : 0;

    
        // Filter out entries where the value is undefined (i.e., no nonstop flights)
        vis.displayData = Array.from(processedData, ([destination, values]) => ({ destination, ...values }))
                            .filter(d => d.totalTravelDistance !== undefined);
    
        // Determine the ratio for the destination city from APPLICATION_STATE
        vis.applicationStateRatio = vis.displayData.find(d => d.destination === APPLICATION_STATE.selectedCity)?.ratio;

        // Calculate the percentage of ratios that are lower than the applicationStateRatio
        let countLowerRatios = vis.displayData.filter(d => d.ratio < this.applicationStateRatio).length;
        let percentage = 100 - (countLowerRatios / vis.displayData.length) * 100;
        let preposition = "top"
        let message = "Good choice!"
        if (percentage < 33){
            message = "Great choice!"
        }
        else if (percentage < 66){
            message = "Solid choice."
        }
        else if (percentage < 100){
            message = "Yikes!"
            preposition = "bottom";
            percentage = 100 - percentage;
        }
    
        
        vis.msg = `${message} ${APPLICATION_STATE.selectedCity} is in the ${preposition} ${(100 - percentage).toFixed(2)}% of destinations in terms of cost per mile!`;

       
        vis.bestValueDestination = bestValueDestination;
        vis.applicationStateTopPercentage = 100 - percentage;
        
        console.log(vis.displayData);
        console.log(vis.bestValueDestination);
    
        vis.updateVis();
    }

    updateVis(){
        let vis = this;
    
       
        vis.x.domain([0, d3.max(vis.displayData, d => d.averageFare)]);
        vis.y.domain([0, d3.max(vis.displayData, d => d.totalTravelDistance)]);
    
       
        vis.svg.select(".x-axis").call(vis.xAxis);
        vis.svg.select(".y-axis").attr("transform", `translate(${vis.margin.left}, 0)`).call(vis.yAxis);
        
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

        const lineGenerator = vis.createLineGenerator();
        const lineData = [{ averageFare: d3.min(vis.displayData, d => d.averageFare)}, { averageFare: d3.max(vis.displayData, d => d.averageFare)}];
        
        vis.svg.append("path")
            .datum(lineData)
            .attr("class", "regression-line")
            .attr("d", lineGenerator)
            .style("stroke", "grey")
            .style("stroke-width", 2);

        vis.callback(vis);
    }
}