/* * * * * * * * * * * * * *
*      class Vis        *
* * * * * * * * * * * * * */


class Vis {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        // parse date method
        this.parseDate = d3.timeParse("%Y-%m-%d");

        this.initVis();
    }

    initVis(){
        let vis = this;

        vis.margin = {top: 20, right: 20, bottom: 20, left: 40};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // add title
        vis.svg.append('g')
            .attr('class', 'title bar-title')
            .append('text')
            .text("Title")
            .attr('transform', `translate(${vis.width / 2}, 10)`)
            .attr('text-anchor', 'middle');

        // TODO: init scales

        // TODO: init axes

        this.wrangleData();
    }

    wrangleData(){
        let vis = this
        
        // TODO: prepare data for this viz
        
        vis.updateVis()
    }

    updateVis(){
        let vis = this;

        // TODO: draw viz
    }
}