    /* * * * * * * * * * * * * *
    *      class CalendarVis        *
    * * * * * * * * * * * * * */


    class CalendarVis {

        constructor(parentElement, data, callback) {
        this.parentElement = parentElement;
        this.data = data;
        this.dateIcons = [];
        this.callback = callback;

        // parse date method
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

        // The number of weeks between the start of the month and the given date
        weekOfMonth(date) {
            const weekInMonth = d3.timeWeek.count(d3.timeMonth(date), date);
            return weekInMonth;
        }

        // The day of the week (0-6) for the given date
        weekday(date) {
            return date.getDay();
        }

        // Text that tooltips should show given a data point
        tooltipText(d) {
            return `$${d[1].toFixed(2)} on average on ${d[0].toLocaleDateString()}`;
        }

        // Return the cheapest week of the month ie. "1st week of May"
        getCheapestWeek() {
        return `${this.cheapestWeek + 1}st week of ${this.averageFareByDate.keys().next().value.toLocaleString('default', { month: 'long' })}`;
        }

        initVis(){
            let vis = this;

            // Title is the name of the month centered above the calendar
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
            // Same as width but apply the top and bottom margins.
            vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().width * 0.85 - vis.margin.top - vis.margin.bottom;

            // Cell size is the width of the calendar divided by 7 days in a week
            vis.cellSize = vis.width / 7;

            // init calendar area
            vis.svg = d3.select("#" + vis.parentElement).append("svg")
                .attr("width", vis.width + vis.margin.left + vis.margin.right)
                .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
                .append('g')
                .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

            // init color scale
            vis.colorScale = d3.scaleSequential()
                .interpolator(d3.interpolateRdYlGn);

            // draw week day headers
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

            // Add button event listener here
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

            // Calculate average fare per day
            vis.averageFareByDate = d3.rollup(
                onlySelectedCity, 
                flights => d3.mean(flights, flight => flight.totalFare), 
                flight => vis.parseDate(flight.flightDate)
            );

            // Calculate the cheapest weak on average
            vis.cheapestWeek = d3.min(
                vis.averageFareByDate, 
                d => vis.weekOfMonth(d[0])
            );
            
            vis.updateVis()
        }

        updateVis(){
            let vis = this;

            // Update color scale with domain
            vis.colorScale.domain(
            d3.extent(vis.averageFareByDate.values())
                // Reverse the domain so that the lowest value is green and the highest is red
                .reverse()
            );

            // Draw calendar cells
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
                    // Move the tooltip
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
                    // Hide the tooltip
                    vis.tooltip.style("opacity", 0);
                    // Remove highlight from the cell
                    d3.select(this)
                        .style("stroke", "none");
                });
            
            // Add white text to cells with the day of the month
            const dayOfMonth = vis.svg.append('g')
                .selectAll("text")
                .data(vis.averageFareByDate)
                .join("text")
                    .attr("x", d => vis.weekday(d[0]) * vis.cellSize + 5)
                    .attr("y", d => vis.weekOfMonth(d[0]) * vis.cellSize + 15)
                    .text(d => d[0].getDate())
                    .attr("fill", "white")
                    .attr("font-size", 12);

            // Call the callback function
            vis.callback(vis);
        }
    }