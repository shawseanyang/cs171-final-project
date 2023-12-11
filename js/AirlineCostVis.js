/* * * * * * * * * * * * * * *
*   class AirlineCostVis     *
* * * * * * * * * * * * * * */

class AirlineCostVis {

    constructor(parentElement, data, callback) {
        this.parentElement = parentElement;
        this.data = data;
        this.callback = callback;

        this.parseDate = d3.timeParse("%Y-%m-%d");

        this.initVis();
    }

    getCheapestAirline() {
        return `${this.averageCostArray[this.averageCostArray.length - 1].segmentsAirlineName}`;
    }



    initVis() {
        let vis = this;

        vis.margin = { top: 40, right: 20, bottom: 100, left: 80 };
        vis.width = 600 - vis.margin.left - vis.margin.right;
        vis.height = 400 - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select('#' + vis.parentElement).append('svg')
            .attr('width', vis.width + vis.margin.left + vis.margin.right)
            .attr('height', vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate(${vis.margin.left}, ${vis.margin.top})`);

        vis.x = d3.scaleBand()
            .range([0, vis.width])
            .padding(0.1);
        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.xAxisGroup = vis.svg.append('g')
            .attr('transform', `translate(0, ${vis.height})`);
        vis.yAxisGroup = vis.svg.append('g');

        vis.colorScale = d3.scaleSequential()
        .interpolator(d3.interpolateRdYlGn);

        vis.svg.append("text")
            .attr("class", "axis-label")
            .attr("y", -60)
            .attr("x", -vis.height / 2)
            .attr("transform", "rotate(-90)")
            .attr("text-anchor", "middle")
            .text("Average Fare");



        this.wrangleData();
    }

    wrangleData() {
        let vis = this;

        vis.filteredData = vis.data.filter(d => d.destinationAirport === APPLICATION_STATE.selectedCity);

        // Process airline names to handle "Airline || Airline" cases
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
    
        // Remove any entries that have null for the airline name after processing
        vis.filteredData = vis.filteredData.filter(d => d.segmentsAirlineName !== null);
    
        vis.averageCostByAirline = d3.rollup(
            vis.filteredData,
            flights => d3.mean(flights, flight => flight.totalFare),
            flight => flight.segmentsAirlineName
        );
    
        // Convert the map to an array for easier processing and sort by average cost
        vis.averageCostArray = Array.from(vis.averageCostByAirline, ([segmentsAirlineName, averageCost]) => ({ segmentsAirlineName, averageCost }))
            .sort((a, b) => b.averageCost - a.averageCost); 
    

        vis.colorScale.domain(
                d3.extent(vis.averageCostArray, d => d.averageCost).reverse()
            );
    
    
        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.x.domain(vis.averageCostArray.map(d => d.segmentsAirlineName));
        vis.y.domain([0, d3.max(vis.averageCostArray, d => d.averageCost)]);

        vis.xAxisGroup.call(d3.axisBottom(vis.x));
        vis.yAxisGroup.call(d3.axisLeft(vis.y));

        vis.xAxisGroup.selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

        vis.xAxisGroup
        .attr('transform', `translate(0, ${vis.height + 20})`)
        .call(d3.axisBottom(vis.x))
        .selectAll("text")
        .attr("y", 0)
        .attr("x", -10)
        .attr("dy", ".35em")
        .attr("transform", "rotate(-65)")
        .style("text-anchor", "end");

        const bars = vis.svg.selectAll('.bar')
            .data(vis.averageCostArray)
            .join('rect')
            .attr('class', 'bar')
            .attr('x', d => vis.x(d.segmentsAirlineName))
            .attr('y', d => vis.y(d.averageCost))
            .attr('width', vis.x.bandwidth())
            .attr('height', d => vis.height - vis.y(d.averageCost))
            .attr('fill', d => vis.colorScale(d.averageCost));

        vis.callback(vis);
    }
}
