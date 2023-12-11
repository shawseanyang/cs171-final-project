/* * * * * * * * * * * * * *
*      class BudgetMapVis  *
* * * * * * * * * * * * * */


class BudgetMapVis {

    MIN_SEPARATION = 30;
    BOSTON_SEPARATION = 50;
    NODE_SIZE = 5;

    constructor(parentElement, data, airports) {
      this.parentElement = parentElement;
      this.data = data;
      this.airports = airports;

      this.parseDate = d3.timeParse("%Y-%m-%d");

      this.initVis();
    }

    getBostonPositionInForceLayout() {
      let vis = this;
      let boston = vis.nodes.filter(d => vis.isBoston(d.iata))[0];
      return [boston.rendered_x, boston.rendered_y];
    }

    isBoston(iata) {
      return iata === "BOS";
    }

    boundedPosition(x, y) {
        let vis = this;
        return [Math.max(vis.margin.left, Math.min(vis.width - vis.margin.right, x)), Math.max(vis.margin.top, Math.min(vis.height - vis.margin.bottom, y))];
    }

    getCoordinates(city_iata) {
        let vis = this;
        let airport = vis.airports.filter(d => d.iata === city_iata)[0];
        return [airport.longitude, airport.latitude];
    }

    getProjectedCoordinates(city_iata) {
        let vis = this;
        let coordinates = vis.getCoordinates(city_iata);
        return vis.projection(coordinates);
    }

    tooltipText(d) {
        let vis = this;
        const iata = d;
        const name = vis.airports.filter(airport => airport.iata === d)[0].airport;
        if (vis.isBoston(d)) {
          return `${d}<br>${name}`;
        } else {
          const average = vis.citiesWithinBudget[d].toFixed(2);
          return `${d}<br>Average fare: $${average}<br>${name}`;
        }
    }

    setupDateSlider() {
      let vis = this;

      const slider = document.getElementById('date-slider');

      const [minDate, maxDate] = d3.extent(this.data.map(d => d.flightDate === '' ? undefined : d.flightDate));

      vis.dateRange = [new Date(minDate), new Date(maxDate)];

      function timestamp(str) {
        return new Date(str).getTime();
      }

      let formatter = { to: (str) => {
        const date = new Date(str);
        // "May 1"
        return date.toLocaleString('default', { month: 'short' }) + " " + date.getDate();
      }};

      noUiSlider.create(slider, {
          start: [timestamp(minDate), timestamp(maxDate)],
          connect: true,
          behaviour: 'drag',
          range: {
              'min': timestamp(minDate),
              'max': timestamp(maxDate)
          },
          step: 24 * 60 * 60 * 1000,
          tooltips: [formatter, formatter]
      });

      slider.noUiSlider.on('end', function (values, handle) {
        vis.dateRange = values.map(timestamp => new Date(Number(timestamp)));
        vis.filterData();
      });
    }

    setupBudgetSlider() {
      let vis = this;

      const slider = document.getElementById('budget-slider');

      const [minBudget, maxBudget] = d3.extent(this.data.map(d => d.totalFare === '' ? undefined : Math.ceil(Number(d.totalFare))));

      let formatter = { to: (str) => "$" + Math.floor(Number(str)) };

      let startingBudget = Math.floor(d3.median(this.data.map(d => d.totalFare === '' ? undefined : Math.ceil(Number(d.totalFare)))));

      vis.budget = startingBudget;

      noUiSlider.create(slider, {
          start: startingBudget,
          connect: true,
          behaviour: 'drag',
          range: {
              'min': minBudget,
              'max': maxBudget
          },
          step: 1,
          tooltips: [formatter]
      });

      slider.noUiSlider.on('end', function (values, handle) {
        vis.budget = values[handle];
        vis.filterData();
      });
    }

    initVis(){
        let vis = this;

        vis.margin = {top: 30, right: 30, bottom: 30, left: 30};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().width * 2 / 3 - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        vis.svg.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr("fill", "#eee")
            .attr("rx", 10)
            .attr("ry", 10);

        vis.projection = d3.geoAlbersUsa()
            .translate([vis.width / 2, vis.height / 2])
            .scale([1000]);
        
        vis.path = d3.geoPath()
            .projection(vis.projection);

        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("font-weight", "bold")
            .style("font-size", "12px")
            .style("background-color", "black")
            .style("border-radius", "5px")
            .style("color", "white")
            .style("padding", "5px")
            .style("opacity", 0);

        vis.setupDateSlider();
        vis.setupBudgetSlider();

        this.wrangleData();
    }

    wrangleData(){
        let vis = this;

        vis.cities = new Set(vis.data.map(d => d.destinationAirport));

        vis.cities.delete("");

        vis.filterData();
    }

    filterData() {
        let vis = this;
        
        // For each city, calculate the average fare over the date range to fly there from BOS
        let citiesWithinBudget = {};
        vis.cities.forEach(city => {
            let cityData = vis.data.filter(d => d.destinationAirport === city);
            let dateRangeData = cityData.filter(d => d.flightDate >= vis.dateRange[0] && d.flightDate <= vis.dateRange[1]);
            let average = d3.mean(dateRangeData.map(d => d.totalFare));
            if (average < vis.budget) {
                citiesWithinBudget[city] = average;
            }
        });
        vis.citiesWithinBudget = citiesWithinBudget;

        vis.updateVis();
    }

    updateVis(){
        let vis = this;

        vis.nodes = Object.keys(vis.citiesWithinBudget).map(d => {
            return {
                iata: d,
            }
        });

        // Add a special node for Boston
        vis.nodes.push({
            iata: "BOS",
        });

        vis.simulation = d3.forceSimulation(vis.nodes)
          .force('charge', d3.forceManyBody().strength(5))
          .force('x', d3.forceX().x(d => vis.getProjectedCoordinates(d.iata)[0]))
          .force('y', d3.forceY().y(d => vis.getProjectedCoordinates(d.iata)[1]))
          .force('collision', d3.forceCollide().radius(d => vis.isBoston(d.iata) ? vis.BOSTON_SEPARATION : vis.MIN_SEPARATION))
          .stop()
          .tick(600);

        vis.nodes.forEach(d => {
            const [x, y] = vis.boundedPosition(d.x, d.y);
            d.rendered_x = x;
            d.rendered_y = y;
        });

        let arcs = vis.svg.selectAll("path.arc")
          .data(vis.nodes.filter(d => !vis.isBoston(d.iata)), d => d.iata)
          .join("path")
          .attr("class", "arc")
          .transition(500)
          .attr("d", d => {
            const boston = vis.getBostonPositionInForceLayout();
            const city = [d.rendered_x, d.rendered_y];
            const dx = city[0] - boston[0];
            const dy = city[1] - boston[1];
            const dr = Math.sqrt(dx * dx + dy * dy);
            const sweep = vis.isBoston(d.iata) ? 0 : 1;
            return `M${boston[0]},${boston[1]}A${dr},${dr} 0 0,${sweep} ${city[0]},${city[1]}`;
          })
          .attr("fill", "none")
          .attr("stroke", "lightgray")
          .attr("stroke-width", 1);

        let airportGroup = vis.svg.selectAll("g.airport")
          .data(vis.nodes, d => d.iata)
          .join("g")
          .attr("class", "airport");

        airportGroup.transition(500)
          .attr("transform", d => `translate(${d.rendered_x}, ${d.rendered_y})`);
        
        airportGroup.append("circle")
              .on("mousemove", function(event, d) {
                const x = (event.pageX + 28);
                const y = (event.pageY - 28);
                vis.tooltip.style("opacity", .9);
                vis.tooltip.html(vis.tooltipText(d.iata))
                    .style("left", x + "px")
                    .style("top", y + "px");
                d3.select(this)
                    .style("stroke", "black")
                    .style("stroke-width", 2);
            })
            .on("mouseout", function(event, d) {
                vis.tooltip.style("opacity", 0);
                d3.select(this)
                    .style("stroke", "none");
            })
            .attr("r", vis.NODE_SIZE)
            .attr("fill", d => vis.isBoston(d.iata) ? "red" : "gray");
        
        airportGroup.append("text")
            .attr("x", 10)
            .attr("y", 10)
            .text(d => `${d.iata}`)
            .attr("font-size", "10px")
            .attr("fill", d => vis.isBoston(d.iata) ? "red" : "gray");
        
        airportGroup.append("text")
            .attr("x", 10)
            .attr("y", 20)
            .text(d => vis.isBoston(d.iata) ? '' : `$${vis.citiesWithinBudget[d.iata].toFixed(0)}`)
            .attr("font-size", "10px")
            .attr("fill", "gray");
      }
}