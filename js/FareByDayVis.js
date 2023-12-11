class FareByDayVis {

    constructor(parentElement, data, callback) {
        this.parentElement = parentElement;
        this.data = data;
        this.callback = callback;
        this.parseDate = d3.timeParse("%Y-%m-%d");
        this.dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        this.initVis();
    }

    weekday(date) {
        if (date == null){
            console.log("oh shit oh fuck")
            console.log(date)
        }
        return date.getDay();
    }

    initVis() {
        let vis = this;

        vis.margin = { top: 10, right: 15, bottom: 25, left: 35 }; // Increase the bottom margin as needed
        vis.totalWidth = d3.select("#" + vis.parentElement).node().getBoundingClientRect().width || window.innerWidth;
        vis.width = vis.totalWidth - vis.margin.left - vis.margin.right;
    
        vis.height = 120 - vis.margin.top - vis.margin.bottom;

        // Create SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).selectAll("svg")
            .data(d3.range(7))
            .enter().append("svg")
            .attr("width", vis.width / 7)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Scales and axes
        vis.x = d3.scalePoint().range([0, vis.width / 7 - vis.margin.left - vis.margin.right]).padding(1);
        vis.y = d3.scaleLinear().range([vis.height, 0]);

        vis.yAxis = d3.axisLeft(vis.y).ticks(3);

        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .call(vis.yAxis);
                // Create a tooltip for hover-over information
        vis.tooltip = d3.select("body").append("div") 
            .attr("class", "tooltip")             
            .style("opacity", 0)
            .style("position", "absolute")
            .style("text-align", "center")
            .style("width", "120px")
            .style("height", "28px")
            .style("padding", "2px")
            .style("font", "12px sans-serif")
            .style("background", "lightsteelblue")
            .style("border", "0px")
            .style("border-radius", "8px")
            .style("pointer-events", "none");

        vis.colorScale = d3.scaleSequential()
            .interpolator(d3.interpolateRdYlGn);
        // Initialize data processing
        this.wrangleData();
    }

    wrangleData() {
        let vis = this;

        // Convert date and filter data
        vis.filteredData = vis.data.filter(d => vis.parseDate(d.flightDate) != null).map(d => {
            d.flightDate = vis.parseDate(d.flightDate);
            if (d.flightDate == null){
                console.log("oh shit oh fuck")
                console.log(d)
            }
            d.weekday = vis.weekday(d.flightDate);
            return d;
        });

        vis.filteredData.forEach(d => {
            if (d.segmentsAirlineName && d.segmentsAirlineName.includes('||')) {
                const parts = d.segmentsAirlineName.split('||').map(s => s.trim());
                if (parts.length === 2 && parts[0] === parts[1]) {
                    d.segmentsAirlineName = parts[0]; // Keep one airline name if both are the same
                } else {
                    d.segmentsAirlineName = null; // Mark as null if they are different
                }
            }
        });
        vis.filteredData = vis.filteredData.filter(d => d.segmentsAirlineName !== null);
        
    

        // Group data by day and airline
        vis.averageFares = d3.rollups(vis.filteredData, 
            v => d3.mean(v, d => d.totalFare).toFixed(2), 
            d => d.weekday, 
            d => d.segmentsAirlineName
        );

        // Find the day with the lowest average fare
        vis.minAverageFare = d3.min(vis.averageFares, d => d3.min(d[1], a => a[1]));

        const minFare = d3.min(vis.filteredData, d => d.totalFare);
        const maxFare = d3.max(vis.filteredData, d => d.totalFare);
        vis.colorScale.domain([maxFare, minFare]); // Reverse domain for red to green
    
    
        this.updateVis();
    }

    updateVis() {
        let vis = this;

        // Draw the small multiples
        vis.svg.each(function(weekday) {
            const svg = d3.select(this);

            // Filter data for this weekday
            const dayData = vis.averageFares.find(d => d[0] === weekday);
            const airlineFares = dayData ? dayData[1] : [];

            // Define domain for the airlines and update the y-axis domain
            vis.x.domain(airlineFares.map(d => d[0]));
            vis.y.domain([0, d3.max(airlineFares, d => d[1])]);

            // Update the y-axis
            svg.select(".y-axis").call(vis.yAxis);

            // Draw lines for average fare of each airline
            airlineFares.forEach(function(airline) {
                svg.append("line")
                    .attr("x1", vis.x(airline[0]))
                    .attr("x2", vis.x(airline[0]))
                    .attr("y1", vis.y(airline[1]))
                    .attr("y2", vis.height)
                    .attr("stroke", "black");
            });
            svg.selectAll(".dot")
                .data(airlineFares)
                .enter()
                .append("circle")
                .attr("class", "dot")
                .attr("cx", d => vis.x(d[0]))
                .attr("cy", d => vis.y(d[1]))
                .attr("r", 4)
                .style("fill", d => vis.colorScale(d[1]))
                .on("mouseover", function(event, d) {
                    vis.tooltip.transition()        
                        .duration(200)      
                        .style("opacity", .9);      
                    vis.tooltip.html(d[0] + "<br/>" + "$" + d[1])  
                        .style("left", (event.pageX) + "px")     
                        .style("top", (event.pageY - 28) + "px");
                })                  
                .on("mouseout", function(d) {       
                    vis.tooltip.transition()        
                        .duration(500)      
                        .style("opacity", 0);   
                });
            
            svg.append("text")
                .attr("x", (vis.width / 7 - vis.margin.left - vis.margin.right) / 2)
                .attr("y", vis.height + vis.margin.top + 10) // Adjust this value to position the labels correctly
                .attr("text-anchor", "middle")
                .attr("font-size", "10px")
                .attr("font-weight", "bold")
                .text(vis.dayNames[weekday]);
    

            // Highlight the day with the lowest average fare
            if (dayData && d3.min(airlineFares, d => d[1]) === vis.minAverageFare) {
                svg.append("rect")
                    .attr("width", vis.width / 7 - vis.margin.left - vis.margin.right)
                    .attr("height", vis.height)
                    .attr("fill", "Aquamarine")
                    .lower();
            }

        });
        vis.callback(vis);
    }
}
