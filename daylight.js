(function() {
 angular.module('daylight', ['tzwhere', 'leaflet-directive'])
  .controller('DaylightController', ['Timezone', '$scope', '$location', function(Timezone, $scope, $location) {
    var ctrl = this;
    var keys = $location.search();
    console.log(keys);
    ctrl.lat = parseFloat(keys.lat);
    ctrl.lng = parseFloat(keys.lng);
    ctrl.Timezone = Timezone;
    ctrl.markers = {};
    ctrl.markers.marker = {
      lat:this.lat,
      lng:this.lng,
      draggable: true
    };

    $scope.$watch(function() {
      return ctrl.markers.marker.lat;
    }, function() {
      $location.search('lat', ctrl.markers.marker.lat).replace();
    }, true);

    $scope.$watch(function() {
      return ctrl.markers.marker.lng;
    }, function() {
      $location.search('lng', ctrl.markers.marker.lng).replace();
    }, true);

    $scope.$on("leafletDirectiveMarker.dragend", function(event, args){
        ctrl.markers.marker.lat = ((args.model.lat + 90) % 180) - 90;
        ctrl.markers.marker.lng = ((args.model.lng + 180) % 360) - 180;
    });
  }])
  .factory('Timezone', ['$http', 'TZWhere', function($http, TZWhere) {
    factory = {};
    factory.location = {lat: 0.0, lng: 0.0, timezone: ''};
    factory.setLatLng = setLatLng;
    factory.UTCMinutesToTZMinutes = UTCMinutesToTZMinutes;
    factory.postInits = [];
    factory.initialized = false;
    factory.addPostInit = addPostInit;
    TZWhere.init('./tz_world_compressed.json').then(function() {
      console.log('timezones loaded');
      factory.initialized = true;
      angular.forEach(factory.postInits, function(func) {func();} );
    });
    
    // function definitions //
    function addPostInit(func) {
      if (factory.initialized === true) 
        func();
      else {
        console.log('adding postInit function!');
        factory.postInits.push(func);
      }
    }

    function setLatLng(lat, lng) {
      factory.location.lat = lat;
      factory.location.lng = lng;
      factory.location.timezone = TZWhere.tzNameAt(lat, lng);
    }

    function UTCMinutesToTZMinutes(day, minutes){
      var my_moment = moment(day).utc().hours(0).minutes(minutes).seconds((minutes % 1)*60).tz(factory.location.timezone);
      return my_moment.hours()*60 + my_moment.minutes() + my_moment.seconds()/60;
    }

    return factory;
  }])
  .directive('daylightPlot', ['Timezone', function(Timezone) {
    return {
      'restrict': 'EA',
      'scope': {lat: '=', lng: '='},
      'link': function(scope, element, attrs) {
        Timezone.addPostInit(function() {
          console.log('setting lat/lng');
          Timezone.setLatLng(scope.lat, scope.lng);
          console.log('render');
          scope.render();
        });
        var width = attrs.width || 700;
        var height = attrs.height || 525;
        var padding = 40;
        var noon = 60*12;
        var midnight = 60*24;
        
        var dayLength = d3.select(element[0])
          .append("svg:svg")
          .attr("width", width + padding * 2)
          .attr("height", height + padding * 2);
      
        var tooltip = d3.select(element[0])
          .append('div')
          .attr('class', 'tooltip');
        tooltip.append('div')
          .attr('class', 'sunrise');
        tooltip.append('div')
          .attr('class', 'sunset');


        scope.$watch('lat', function() {
          Timezone.setLatLng(scope.lat, scope.lng);
          scope.render();
        }, true);
        scope.$watch('lng', function() {
          Timezone.setLatLng(scope.lat, scope.lng);
          scope.render();
        }, true);
        
        scope.render = function() {
          dayLength.selectAll('*').remove();

          console.log('rendering!');
          // the vertical axis is a time scale that runs from 00:00 - 23:59
          // the horizontal axis is a time scale that runs from the 2011-01-01 to 2011-12-31
          
          var y = d3.time.scale()
            .domain([new Date(2011, 0, 1), new Date(2011, 0, 1, 23, 59)])
            .range([0, height]);
          var x = d3.time.scale()
            .domain([new Date(2011, 0, 1), new Date(2011, 11, 31)])
            .range([0, width]);
          
          var monthNames = ["Jan", "Feb", "Mar", "April", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          
          // Create a list of dates from the x() time scale
          // Gets dates evenly spaced every 5 days
          var data = x.ticks(d3.time.days, 5).map( function(date){ return {date: date}; } );
          
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
          
          var minute_scale = d3.scale.linear()
            .domain([0, 24*60])
            .range([0, height]);

          angular.forEach(data, function(d) {
            d.sunset = calcSunriseSetUTC(0, d.date.getJulian(), scope.lat, scope.lng); 
            if (typeof d.sunset === 'number')
              d.sunset = Timezone.UTCMinutesToTZMinutes(d.date, d.sunset);
            d.sunrise = calcSunriseSetUTC(1, d.date.getJulian(), scope.lat, scope.lng);
            if (typeof d.sunrise === 'number')
              d.sunrise = Timezone.UTCMinutesToTZMinutes(d.date, d.sunrise);
          });

          var sunrise_before_midnight = function(d) {
            return (d.sunrise > d.sunset && d.sunrise > noon);
          };

          var sunset_after_midnight = function(d) {
            return (d.sunset < d.sunrise && d.sunset < noon);
          };
          
          var sunriseLine = d3.svg.area()
            .x(function(d) { return x(d.date); })
            .y0(function(d) {
                if (d.sunrise === 'NO SUNRISE' || d.sunrise === 'NO SUNSET' || !sunset_after_midnight(d)) {
                  return 0;
                } else {
                  return minute_scale(d.sunset);
                }
              })
            .y1(function(d) { 
                if (d.sunrise === 'NO SUNRISE') {
                  return height/2;
                } else if (d.sunrise === 'NO SUNSET' || sunrise_before_midnight(d)) {
                  return 0;
                } else {
                  return minute_scale(d.sunrise);
                }
              })
            .interpolate("linear");

          lineGroup
            .append("svg:path")
            .attr("d", sunriseLine(data))
            .attr("fill", "steelblue");
          
          var sunsetLine = d3.svg.area()
            .x(function(d) { return x(d.date); })
            .y0(function(d) {
                if (d.sunset === 'NO SUNSET' || d.sunset === 'NO SUNRISE' || !sunrise_before_midnight(d)) {
                  return height;
                } else {
                  return minute_scale(d.sunrise);
                }
              })
            .y1(function(d) { 
                if (d.sunset === 'NO SUNRISE') {
                  return height/2;
                } else if (d.sunset === 'NO SUNSET' || sunset_after_midnight(d)) {
                  return height;
                } else {
                  return minute_scale(d.sunset);
                }
              })
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

          var bisectDate = d3.bisector(function(d) { return d.date; }).left;
          var indicator_params = {};
          indicator_params.radius = 5;
          indicator_params.stroke = 'darkgray';
          indicator_params.stroke_width = 2;

          var day_indicator = lineGroup
            .append('svg:line')
            .attr('stroke', indicator_params.stroke)
            .attr('stroke-width', indicator_params.stroke_width);

          var sunrise_indicator = lineGroup
            .append('svg:circle')
            .attr('r', indicator_params.radius)
            .attr('stroke', indicator_params.stroke)
            .attr('stroke-width', indicator_params.stroke_width)
            .attr('fill-opacity', 0);

          var sunset_indicator = lineGroup
            .append('svg:circle')
            .attr('r', indicator_params.radius)
            .attr('stroke', indicator_params.stroke)
            .attr('stroke-width', indicator_params.stroke_width)
            .attr('fill-opacity', 0);

          var setIndicatorDisplay = function(display) { 
            return function() {
              tooltip.style('display', display);
              sunrise_indicator.style('display', display);
              sunset_indicator.style('display', display);
              day_indicator.style('display', display);
            };
          };
          
          var enableIndicators = setIndicatorDisplay('block');
          var disableIndicators = setIndicatorDisplay('none');

          lineGroup.selectAll('rect, path')
            .on('mouseenter', enableIndicators)
            .on('mouseleave', disableIndicators)
            .on('mousemove', function() {
              var x_pos = d3.mouse(this)[0];
              var x0 = x.invert(x_pos);
                  i = bisectDate(data, x0, 1);
                  d0 = data[i];
                  d1 = data[i+1];
                  
              tooltip.select('.sunrise').html(d0.sunrise);
              tooltip.select('.sunset').html(d0.sunrise);

              var sunrise_pos = minute_scale(d0.sunrise);
              var sunset_pos = minute_scale(d0.sunset);

              sunrise_indicator
                .attr('cx', x_pos)
                .attr('cy', sunrise_pos);
              sunset_indicator
                .attr('cx', x_pos)
                .attr('cy', sunset_pos);
              day_indicator
                .attr('x1', x_pos)
                .attr('x2', x_pos)
                .attr('y1', sunrise_pos + indicator_params.radius)
                .attr('y2', sunset_pos - indicator_params.radius);
            });


        };
      }
    };
  }]);
})();
