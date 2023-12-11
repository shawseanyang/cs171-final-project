    /* * * * * * * * * * * * * *
    *      class CalendarVis        *
    * * * * * * * * * * * * * */


    class CalendarVis {

        constructor(parentElement, data, callback) {
        this.parentElement = parentElement;
        this.data = data;
        this.dateIcons = [];
        this.callback = callback;

        this.parseDate = function(input) {
          if (input instanceof Date) {
            return input;
          } else {
            var parser = d3.timeParse("%Y-%m-%d");
            return parser(input);
          }
        };

        this.initVis();
        }

        weekOfMonth(date) {
            const weekInMonth = d3.timeWeek.count(d3.timeMonth(date), date);
            return weekInMonth;
        }

        weekday(date) {
            return date.getDay();
        }

        tooltipText(d) {
            return `$${d[1].toFixed(2)} on average on ${d[0].toLocaleDateString()}`;
        }

        getCheapestWeek() {
        return `${this.cheapestWeek + 1}st week of ${this.averageFareByDate.keys().next().value.toLocaleString('default', { month: 'long' })}`;
        }

        initVis(){
            let vis = this;

            vis.title = d3.select("#" + vis.parentElement).append("p")
                .style("text-align", "center")
                .style("font-weight", "bold")
                .style("font-size", "20px")
                .style("margin-top", "20px")
                .style("margin-bottom", "20px")
                .style("text-transform", "uppercase")
                .text(vis.parseDate(vis.data[0].flightDate).toLocaleString('default', { month: 'long' }));

            vis.margin = {top: 20, right: 0, bottom: 40, left: 0};
            vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
            vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().width * 0.85 - vis.margin.top - vis.margin.bottom;

            vis.cellSize = vis.width / 7;

            vis.svg = d3.select("#" + vis.parentElement).append("svg")
                .attr("width", vis.width + vis.margin.left + vis.margin.right)
                .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
                .append('g')
                .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

            vis.colorScale = d3.scaleSequential()
                .interpolator(d3.interpolateRdYlGn);

            const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const weekDayHeader = vis.svg.append('g')
                .selectAll("text")
                .data(weekDays)
                .join("text")
                .attr("x", (d, i) => i * vis.cellSize)
                .attr("y", -5)
                .text(d => d);

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

            // button event listener
            let button = document.getElementById('vis3-button');
            if (button) {
                button.addEventListener('click', function() {
                    const elements = document.querySelectorAll('.commencement-dates');
                    elements.forEach(el => {
                        el.classList.add('visible');
                    });
                });
            } else {
                console.error('Button #vis3-button not found');
            }

            this.wrangleData();
        }

        wrangleData(){
            let vis = this;

            // Filter to only include data for selected city
            const onlySelectedCity = vis.data.filter(d => d.destinationAirport == APPLICATION_STATE.selectedCity);

            // Calc average fare per day
            vis.averageFareByDate = d3.rollup(
                onlySelectedCity, 
                flights => d3.mean(flights, flight => flight.totalFare), 
                flight => vis.parseDate(flight.flightDate)
            );

            // Calc avg cheapest week
            vis.cheapestWeek = d3.min(
                vis.averageFareByDate, 
                d => vis.weekOfMonth(d[0])
            );
            
            vis.updateVis()
        }

        updateVis(){
            let vis = this;

          
            vis.colorScale.domain(
            d3.extent(vis.averageFareByDate.values())
                .reverse()
            );

            // Draw calendar (cells)
            const cell = vis.svg.append('g')
            .selectAll("rect")
            .data(vis.averageFareByDate)
            .join("rect")
                .attr("width", vis.cellSize - 1)
                .attr("height", vis.cellSize - 1)
                .attr('y', d => vis.weekOfMonth(d[0]) * vis.cellSize)
                .attr('x', d => vis.weekday(d[0]) * vis.cellSize)
                .attr("fill", d => vis.colorScale(d[1]))
                .on("mousemove", function(event, d) {
                    const x = (event.pageX + 28);
                    const y = (event.pageY - 28);
                    vis.tooltip.style("opacity", .9);
                    vis.tooltip.html(`${vis.tooltipText(d)}`)
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
                });
            
            const dayOfMonth = vis.svg.append('g')
                .selectAll("text")
                .data(vis.averageFareByDate)
                .join("text")
                    .attr("x", d => vis.weekday(d[0]) * vis.cellSize + 5)
                    .attr("y", d => vis.weekOfMonth(d[0]) * vis.cellSize + 15)
                    .text(d => d[0].getDate())
                    .attr("fill", "white")
                    .attr("font-size", 12);

            vis.callback(vis);
        }
    }