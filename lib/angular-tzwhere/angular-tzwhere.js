// This is an adaptation of the great node module tzwhere
// (https://github.com/mattbornski/tzwhere) for use client-side with angular.
// Module provides a service which will load a GeoJSON from a URL

(function() {
  angular.module('tzwhere', [])
    .factory('TZWhere', ['$http', function($http) {
      var f = {};

      f.SHORTCUT_DEGREES_LATITUDE = 1;
      f.SHORTCUT_DEGREES_LONGITUDE = 1;
      f.EXCLUDE_REGIONS = [];

      f.timezoneNamesToPolygons = null;
      f.timezoneLongitudeShortcuts = null;
      f.timezoneLatitudeShortcuts = null;
      f.currentTzWorld = null;

      f.init = init;
      f.tzNameAt = tzNameAt;

      function init(tzWorldUrl){
        if(f.currentTzWorld !== tzWorldUrl) {
          f.timezoneNamesToPolygons = null;
          f.timezoneLongitudeShortcuts = null;
          f.timezoneLatitudeShortcuts = null;

          $http.get(tzWorldUrl).success(function(data) {
            console.log('data received!');
            console.log(data);
            f.currentTzWorld = tzWorldUrl;
            constructShortcuts(data);
          });

          return true;
        } else {
          return false;
        }
      }

      function constructShortcuts(tzWorldData) {
        // Construct once
        if ((f.timezoneNamesToPolygons === null) || (f.timezoneLongitudeShortcuts === null)) {
          // Try to read from cache first
          if (false) {
            // TODO read from cached shortcut file
          } else {
            var now = Date.now();
            var featureCollection = tzWorldData;
            f.timezoneNamesToPolygons = {};
            for (var featureIndex in featureCollection.features) {
              var tzname = featureCollection.features[featureIndex].properties.TZID;
              var region = tzname.split('/')[0];
              if (f.EXCLUDE_REGIONS.indexOf(region) === -1) {
                if (featureCollection.features[featureIndex].geometry.type === 'Polygon') {
                  var polys = featureCollection.features[featureIndex].geometry.coordinates;
                  if (polys.length > 0 && !(tzname in f.timezoneNamesToPolygons)) {
                    f.timezoneNamesToPolygons[tzname] = [];
                  }
                  for (var polyIndex in polys) {
                    // WPS84 coordinates are [long, lat], while many conventions are [lat, long]
                    // Our data is in WPS84.  Convert to an explicit format which geolib likes.
                    var poly = [];
                    for (var pointIndex in polys[polyIndex]) {
                      poly.push({'lat': polys[polyIndex][pointIndex][1], 'lng': polys[polyIndex][pointIndex][0]});
                    }
                    f.timezoneNamesToPolygons[tzname].push(poly);
                  }
                } else {
                  console.log('WARNING Non-polygon region "' + tzname + '", ignored');
                }
              }
            }
            f.timezoneLongitudeShortcuts = {};
            f.timezoneLatitudeShortcuts = {};
            for (var tzname_iter in f.timezoneNamesToPolygons) {
              for (var polyIndex_iter in f.timezoneNamesToPolygons[tzname_iter]) {
                var poly_iter = f.timezoneNamesToPolygons[tzname_iter][polyIndex_iter];
                var bounds = geolib.getBounds(poly_iter);
                var minLng = Math.floor(bounds.minLng / f.SHORTCUT_DEGREES_LONGITUDE) * f.SHORTCUT_DEGREES_LONGITUDE;
                var maxLng = Math.floor(bounds.maxLng / f.SHORTCUT_DEGREES_LONGITUDE) * f.SHORTCUT_DEGREES_LONGITUDE;
                var minLat = Math.floor(bounds.minLat / f.SHORTCUT_DEGREES_LATITUDE) * f.SHORTCUT_DEGREES_LATITUDE;
                var maxLat = Math.floor(bounds.maxLat / f.SHORTCUT_DEGREES_LATITUDE) * f.SHORTCUT_DEGREES_LATITUDE;
                for (var degree = minLng; degree <= maxLng; degree += f.SHORTCUT_DEGREES_LONGITUDE) {
                  if (!(degree in f.timezoneLongitudeShortcuts)) {
                    f.timezoneLongitudeShortcuts[degree] = {};
                  }
                  if (!(tzname_iter in f.timezoneLongitudeShortcuts[degree])) {
                    f.timezoneLongitudeShortcuts[degree][tzname_iter] = [];
                  }
                  f.timezoneLongitudeShortcuts[degree][tzname_iter].push(polyIndex_iter);
                }
                for (var degree_iter = minLat; degree_iter <= maxLat; degree_iter += f.SHORTCUT_DEGREES_LATITUDE) {
                  if (!(degree_iter in f.timezoneLatitudeShortcuts)) {
                    f.timezoneLatitudeShortcuts[degree_iter] = {};
                  }
                  if (!(tzname_iter in f.timezoneLatitudeShortcuts[degree_iter])) {
                    f.timezoneLatitudeShortcuts[degree_iter][tzname_iter] = [];
                  }
                  f.timezoneLatitudeShortcuts[degree_iter][tzname_iter].push(polyIndex_iter);
                }
              }
            }
            // As we're painstakingly constructing the shortcut table, let's write
            // it to cache so that future generations will be saved the ten
            // seconds of agony, and more importantly, the huge memory consumption.
            var polyTranslationsForReduce = {};
            var reducedShortcutData = {
              'lat': {
                'degree': f.SHORTCUT_DEGREES_LATITUDE,
              },
              'lng': {
                'degree': f.SHORTCUT_DEGREES_LONGITUDE,
              },
              'polys': {},
            };
            var avgTzPerShortcut = 0;
            for (var lngDeg in f.timezoneLongitudeShortcuts) {
              for (var latDeg in f.timezoneLatitudeShortcuts) {
                var lngSet = new Set(Object.keys(f.timezoneLongitudeShortcuts[lngDeg]));
                var latSet = new Set(Object.keys(f.timezoneLatitudeShortcuts[latDeg]));
                var applicableTimezones = intersection(lngSet, latSet);
                if (applicableTimezones.length > 1) {
                  // We need these polys
                  for (var tzindex in applicableTimezones) {
                    var this_tzname = applicableTimezones[tzindex];
                    var latPolys = f.timezoneLatitudeShortcuts[latDeg][this_tzname];
                    var lngPolys = f.timezoneLongitudeShortcuts[lngDeg][this_tzname];

                  }
                }
                avgTzPerShortcut += applicableTimezones.length;
              }
            }
            avgTzPerShortcut /= (Object.keys(f.timezoneLongitudeShortcuts).length * Object.keys(f.timezoneLatitudeShortcuts).length);
            console.log(Date.now() - now + 'ms to construct shortcut table');
            console.log('Average timezones per ' + f.SHORTCUT_DEGREES_LATITUDE + '° lat x ' + f.SHORTCUT_DEGREES_LONGITUDE + '° lng: ' + avgTzPerShortcut);
          }
        }
      }

      function intersection(a, b) {
        var rtrn = [];
        a.forEach(function(x) { if (b.has(x)){ rtrn.push(x); } });
        return rtrn;
      }

      function tzNameAt(latitude, longitude) {
        var latTzOptions = f.timezoneLatitudeShortcuts[Math.floor(latitude / f.SHORTCUT_DEGREES_LATITUDE) * f.SHORTCUT_DEGREES_LATITUDE];
        var latSet = new Set(Object.keys(latTzOptions));
        var lngTzOptions = f.timezoneLongitudeShortcuts[Math.floor(longitude / f.SHORTCUT_DEGREES_LONGITUDE) * f.SHORTCUT_DEGREES_LONGITUDE];
        var lngSet = new Set(Object.keys(lngTzOptions));
        var possibleTimezones = intersection(lngSet, latSet);
        if (possibleTimezones.length) {
          if (possibleTimezones.length === 1) {
            return possibleTimezones[0];
          } else {
            for (var tzindex in possibleTimezones) {
              var tzname = possibleTimezones[tzindex];
              var polyIndices = intersection(new Set(latTzOptions[tzname]), new Set(lngTzOptions[tzname]));
              for (var polyIndexIndex in polyIndices) {
                var polyIndex = polyIndices[polyIndexIndex];
                var poly = f.timezoneNamesToPolygons[tzname][polyIndex];
                var found = geolib.isPointInside({'lat': latitude, 'lng': longitude}, poly);
                if (found) {
                  return tzname;
                }
              }
            }
          }
        }
        return null;
      }

      return f;
    }]);
 })();
