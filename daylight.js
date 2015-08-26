var width = 700;
var height = 525;
var padding = 40;

// the vertical axis is a time scale that runs from 00:00 - 23:59
// the horizontal axis is a time scale that runs from the 2011-01-01 to 2011-12-31

var y = d3.time.scale()
  .domain([new Date(2011, 0, 1), new Date(2011, 0, 1, 23, 59)])
  .range([0, height]);
var x = d3.time.scale()
  .domain([new Date(2011, 0, 1), new Date(2011, 11, 31)])
  .range([0, width]);

var monthNames = ["Jan", "Feb", "Mar", "April", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Sunrise and sun set times for dates in 2011. I have picked the 1st
// and 15th day of every month, plus other important dates like equinoxes
// and solstices and dates around the standard time/DST transition.

var data = [
  {date: new Date(2011, 0, 1), sunrise: [7, 51], sunset: [16, 42]},
  {date: new Date(2011, 0, 15), sunrise: [7, 48], sunset: [16, 58]},
  {date: new Date(2011, 1, 1), sunrise: [7, 33], sunset: [17, 21]},
  {date: new Date(2011, 1, 15), sunrise: [7, 14], sunset: [17, 41]},
  {date: new Date(2011, 2, 1), sunrise: [6, 51], sunset: [18, 0]},
  {date: new Date(2011, 2, 12), sunrise: [6, 32], sunset: [18, 15]}, // dst - 1 day
  {date: new Date(2011, 2, 13), sunrise: [7, 30], sunset: [19, 16]}, // dst
  {date: new Date(2011, 2, 14), sunrise: [7, 28], sunset: [19, 18]}, // dst + 1 day
  {date: new Date(2011, 2, 14), sunrise: [7, 26], sunset: [19, 19]},
  {date: new Date(2011, 2, 20), sunrise: [07, 17], sunset: [19, 25]}, // equinox
  {date: new Date(2011, 3, 1), sunrise: [6, 54], sunset: [19, 41]},
  {date: new Date(2011, 3, 15), sunrise: [6, 29], sunset: [19, 58]},
  {date: new Date(2011, 4, 1), sunrise: [6, 3], sunset: [20, 18]},
  {date: new Date(2011, 4, 15), sunrise: [5, 44], sunset: [20, 35]},
  {date: new Date(2011, 5, 1), sunrise: [5, 30], sunset: [20, 52]},
  {date: new Date(2011, 5, 15), sunrise: [5, 26], sunset: [21, 1]},
  {date: new Date(2011, 5, 21), sunrise: [5, 26], sunset: [21, 3]}, // solstice
  {date: new Date(2011, 6, 1), sunrise: [5, 30], sunset: [21, 3]},
  {date: new Date(2011, 6, 15), sunrise: [5, 41], sunset: [20, 57]},
  {date: new Date(2011, 7, 1), sunrise: [5, 58], sunset: [20, 40]},
  {date: new Date(2011, 7, 15), sunrise: [6, 15], sunset: [20, 20]},
  {date: new Date(2011, 8, 1), sunrise: [6, 35], sunset: [19, 51]},
  {date: new Date(2011, 8, 15), sunrise: [6, 51], sunset: [19, 24]},
  {date: new Date(2011, 8, 23), sunrise: [7, 1], sunset: [19, 9]}, // equinox
  {date: new Date(2011, 9, 1), sunrise: [7, 11], sunset: [18, 54]},
  {date: new Date(2011, 9, 15), sunrise: [7, 28], sunset: [18, 29]},
  {date: new Date(2011, 10, 1), sunrise: [7, 51], sunset: [18, 2]},
  {date: new Date(2011, 10, 5), sunrise: [7, 57], sunset: [17, 56]}, // last day of dst
  {date: new Date(2011, 10, 6), sunrise: [6, 58], sunset: [16, 55]}, // standard time
  {date: new Date(2011, 10, 7), sunrise: [6, 59], sunset: [16, 54]}, // standard time + 1
  {date: new Date(2011, 10, 15), sunrise: [7, 10], sunset: [16, 44]},
  {date: new Date(2011, 11, 1), sunrise: [7, 31], sunset: [16, 33]},
  {date: new Date(2011, 11, 15), sunrise: [7, 44], sunset: [16, 32]},
  {date: new Date(2011, 11, 22), sunrise: [7, 49], sunset: [16, 35]}, // solstice
  {date: new Date(2011, 11, 31), sunrise: [7, 51], sunset: [16, 41]}
];

function yAxisLabel(d) {
  if (d == 12) { return "noon"; }
  if (d < 12) { return d; }
  return (d - 12);
}

// The labels along the x axis will be positioned on the 15th of the
// month

function midMonthDates() {
  return d3.range(0, 12).map(function(i) { return new Date(2011, i, 15); });
}

var dayLength = d3.select("#daylight-plot")
  .append("svg:svg")
  .attr("width", width + padding * 2)
  .attr("height", height + padding * 2);

// create a group to hold the axis-related elements
var axisGroup = dayLength.append("svg:g")
  .attr("transform", "translate(" + padding + "," + padding + ")");

// draw the x and y tick marks. Since they are behind the visualization, they
// can be drawn all the way across it. Because the  has been
// translated, they stick out the left side by going negative.

axisGroup.selectAll(".yTicks")
  .data(d3.range(5, 22))
  .enter().append("svg:line")
  .attr("x1", -5)
  // Round and add 0.5 to fix anti-aliasing effects (see above)
  .attr("y1", function(d) { return d3.round(y(new Date(2011, 0, 1, d))) + 0.5; })
  .attr("x2", width + 5)
  .attr("y2", function(d) { return d3.round(y(new Date(2011, 0, 1, d))) + 0.5; })
  .attr("stroke", "lightgray")
  .attr("class", "yTicks");

axisGroup.selectAll(".xTicks")
  .data(midMonthDates)
  .enter().append("svg:line")
  .attr("x1", x)
  .attr("y1", -5)
  .attr("x2", x)
  .attr("y2", height+5)
  .attr("stroke", "lightgray")
  .attr("class", "yTicks");

// draw the text for the labels. Since it is the same on top and
// bottom, there is probably a cleaner way to do this by copying the
// result and translating it to the opposite side

axisGroup.selectAll("text.xAxisTop")
  .data(midMonthDates)
  .enter()
  .append("svg:text")
  .text(function(d, i) { return monthNames[i]; })
  .attr("x", x)
  .attr("y", -8)
  .attr("text-anchor", "middle")
  .attr("class", "axis xAxisTop");

axisGroup.selectAll("text.xAxisBottom")
  .data(midMonthDates)
  .enter()
  .append("svg:text")
  .text(function(d, i) { return monthNames[i]; })
  .attr("x", x)
  .attr("y", height+15)
  .attr("text-anchor", "middle")
  .attr("class", "xAxisBottom");

axisGroup.selectAll("text.yAxisLeft")
  .data(d3.range(5, 22))
  .enter()
  .append("svg:text")
  .text(yAxisLabel)
  .attr("x", -7)
  .attr("y", function(d) { return y(new Date(2011, 0, 1, d)); })
  .attr("dy", "3")
  .attr("class", "yAxisLeft")
  .attr("text-anchor", "end");

axisGroup.selectAll("text.yAxisRight")
  .data(d3.range(5, 22))
  .enter()
  .append("svg:text")
  .text(yAxisLabel)
  .attr("x", width+7)
  .attr("y", function(d) { return y(new Date(2011, 0, 1, d)); })
  .attr("dy", "3")
  .attr("class", "yAxisRight")
  .attr("text-anchor", "start");

// create a group for the sunrise and sunset paths

var lineGroup = dayLength.append("svg:g").
  attr("transform", "translate("+ padding + ", " + padding + ")");

// draw the background. The part of this that remains uncovered will
// represent the daylight hours.

lineGroup.append("svg:rect")
  .attr("x", 0)
  .attr("y", 0)
  .attr("height", height)
  .attr("width", width)
  .attr("fill", "lightyellow");

// The meat of the visualization is surprisingly simple. sunriseLine
// and sunsetLine are areas (closed svg:path elements) that use the date
// for the x coordinate and sunrise and sunset (respectively) for the y
// coordinate. The sunrise shape is anchored at the top of the chart, and
// sunset area is anchored at the bottom of the chart.

var sunriseLine = d3.svg.area()
  .x(function(d) { return x(d.date); })
  .y1(function(d) { return y(new Date(2011, 0, 1, d.sunrise[0], d.sunrise[1])); })
  .interpolate("linear");

lineGroup
  .append("svg:path")
  .attr("d", sunriseLine(data))
  .attr("fill", "steelblue");

var sunsetLine = d3.svg.area()
  .x(function(d) { return x(d.date); })
  .y0(height)
  .y1(function(d) { return y(new Date(2011, 0, 1, d.sunset[0], d.sunset[1])); })
  .interpolate("linear");

lineGroup.append("svg:path")
  .attr("d", sunsetLine(data))
  .attr("fill", "steelblue");

// finally, draw a line representing 12:00 across the entire
// visualization

lineGroup.append("svg:line")
  .attr("x1", 0)
  .attr("y1", d3.round(y(new Date(2011, 0, 1, 12))) + 0.5)
  .attr("x2", width)
  .attr("y2", d3.round(y(new Date(2011, 0, 1, 12))) + 0.5)
  .attr("stroke", "lightgray");
