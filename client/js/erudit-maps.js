var $map = $("#map");

// Create the Google Map…
var map = new google.maps.Map(d3.select("#map").node(), {
  zoom: 5,
  center: new google.maps.LatLng(55, -72),
  mapTypeId: google.maps.MapTypeId.ROADMAP,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  zoomControl: true,
  zoomControlOptions: {
      position: google.maps.ControlPosition.LEFT_CENTER
  },
  styles:[{"stylers": [{"saturation": -50},{"lightness": 50}]}]
});

var map_data;
var overlays = [];
var colors = ["#e07b91", "#d33f6a", "#11c638", "#8dd593", "#c6dec7", "#ead3c6"
  , "#f0b98d", "#ef9708", "#0fcfc0", "#9cded6", "#d5eae7", "#f3e1eb", "#f6c4e1"
  , "#f79cd4", "#023fa5", "#7d87b9", "#bec1d4", "#d6bcc0", "#bb7784", "#8e063b"
  , "#4a6fe3", "#8595e1", "#b5bbe3", "#e6afb9"];
var color_scale = d3.scale.ordinal().range(colors);
var node_coord = {};

// d3 update map
function update(data) {
  // Add the container when the overlay is added to the map.
  var overlay = new google.maps.OverlayView();
  var polygons = [];
  overlay.onAdd = function() {
    this.layer = d3.select(this.getPanes().overlayMouseTarget).append("div")
        .attr("class", "stations");

    var layer = d3.select(this.getPanes().overlayLayer).append("div").attr("class", "SvgOverlay");
    var svg = layer.append("svg");
    var adminDivisions = svg.append("g").attr("class", "AdminDivisions");

    // Draw each marker as a separate SVG element.
    // We could use a single SVG, but what size would it have?
    overlay.draw = function() {
      var markerOverlay = this;
      var projection = markerOverlay.getProjection();
      var padding = 10, radius = 1;

      // create an svg for each node and apply actions
      var marker = this.layer.selectAll("svg")
          .data(d3.values(data.entities))
          .each(transform) // update existing markers
        .enter().append("svg")
          .each(transform)
          .attr("class", "marker")
          .attr("doc-id", function(d) {
            return d.entityid;
          })
          .attr("journal-id", function(d) {
            return d.entityid;
          })
          .on("mouseover", function(d) {
            d3.select(this).selectAll("circle")
              .attr("r", 9)
              .style("stroke", rgb_highlight);
            // d3.selectAll("svg.links[doc-target='" + d.documentid + "']")
            //   .selectAll("line")
            //   .style("stroke", rgb_highlight);
            // d3.selectAll("svg.links[doc-source='" + d.documentid + "']")
            //   .selectAll("line")
            //   .style("stroke", rgb_highlight);
          })
          .on("mouseout", function(d) {
            d3.select(this).selectAll("circle")
              .attr("r", 4.5)
              .style("stroke", rgb_highlight);
            // d3.selectAll("svg.links[doc-target='" + d.documentid + "']")
            //   .selectAll("line")
            //   .style("stroke", rgb_stroke);
            // d3.selectAll("svg.links[doc-source='" + d.documentid + "']")
            //   .selectAll("line")
            //   .style("stroke", rgb_stroke);
          })
          .on("click", function(d) {
            if(pushInfoWidget(d)) {
              console.log(d);
            }
          });

      // Add a circle.
      marker.append("circle")
          .attr("r", 4.5)
          .attr("cx", padding)
          .attr("cy", padding)
          .attr("fill", function(d) { return color_scale(d.entityid); });
      var p = polygons.pop();
      while(p) {
        p.setMap(null);
        p = polygons.pop();
      }

      for(var i = 0; i < data.documents.length; i++) {
        if(data.documents[i].links.length < 3) continue;
        var coords = getGoogleCoords(data.documents[i].links);
        var polygon = new google.maps.Polygon({
          paths: coords,
          strokeColor: '#FF0000',
          strokeOpacity: 0.5,
          strokeWeight: 1,
          fillColor: '#FF0000',
          fillOpacity: 0.3
        });
        polygons.push(polygon);
      }

      // Bind polygons to the map
      for(var i = 0; i < polygons.length; i++) {
        polygons[i].setMap(map);
      }
      // D3 GEOPATH ~~~~~~~~~~~~~~~~~~~~~~~~
      // Turn the overlay projection into a d3 projection
      // var googleMapProjection = function (coordinates) {
      //     var googleCoordinates = new google.maps.LatLng(coordinates[1], coordinates[0]);
      //     var pixelCoordinates = projection.fromLatLngToDivPixel(googleCoordinates);
      //     return [pixelCoordinates.x + 4000, pixelCoordinates.y + 4000];
      // }
      // // draw polygons for collaboration networks
      // var geo_data = transformToGeoCollection(data.documents);
      // var path = d3.geo.path().projection(googleMapProjection);
      // adminDivisions.selectAll("path")
      //     .data(geo_data.features)
      //     .attr("d", path) // update existing paths
      // .enter().append("svg:path")
      //     .attr("d", path);
      // SVG PATH ~~~~~~~~~~~~~~~~~~~~~~~
      // draw lines between links
      // var markerLink = this.layer.selectAll(".links")
      //   .data(d3.values(data.documents))
      //   .each(pathTransform) // update existing markers
      //   .enter().append("svg:svg")
      //   .attr("class", "links")
      //   .each(pathTransform);


      // transform d by projecting lat and lng values to x y coords
      function transform(d) {
        node_coord[d.entityid] = [d.lat, d.lng];
        d = new google.maps.LatLng(d.lat, d.lng);
        d = projection.fromLatLngToDivPixel(d);
        return d3.select(this)
            .style("left", (d.x - padding) + "px")
            .style("top", (d.y - padding) + "px")
            .style("z-index", 99);
      }

      // draw links between nodes
      function pathTransform(d) {
        var t, b, l, r, current_svg;
        // get rid of the old lines (cannot use d3 .remove() because i cannot use selectors after ... )
        $(this).empty();
        // get google map lat lng projections
        dsrc = new google.maps.LatLng(node_coord[d.source][0], node_coord[d.source][1]);
        dtrg = new google.maps.LatLng(node_coord[d.target][0], node_coord[d.target][1]);
        d1 = projection.fromLatLngToDivPixel(dsrc);
        d2 = projection.fromLatLngToDivPixel(dtrg);

        if ( d1.y < d2.y ) {
            t = d1.y, b = d2.y;
        } else {
            t = d2.y, b = d1.y;
        }
        if ( d1.x < d2.x ) {
            l = d1.x, r = d2.x;
        } else {
            l = d2.x, r = d1.x;
        }
        // create a box extending from point to point
        current_svg = d3.select(this)
          .style("left", (l + radius) + "px")
          .style("top", (t + radius) + "px")
          .style("width", (r - l - radius) + "px")
          .style("height", (b - t - radius) + "px")
          .style("z-index", 98)
          .attr("doc-source", d.source)
          .attr("doc-target", d.target);
        // get start and end coordinates
        var x1, x2, y1, y2;
        if ((( d1.y < d2.y) && ( d1.x < d2.x)) || ((d1.x > d2.x) && (d1.y > d2.y))) {
          x1 = 0, x2 = r-l;
          y1 = 0, y2 = b-t;
        } else if ((( d1.y < d2.y) && ( d1.x > d2.x)) || ((d1.x < d2.x) && (d1.y > d2.y))){
          x1 = r-l, x2 = 0;
          y1 = 0, y2 = b-t;
        }
        // drawing the diagonal lines inside the svg elements.
        current_svg.append("svg:line")
          .style("stroke-width", 1)
          .style("stroke", rgb_stroke)
          .attr("x1", x1)
          .attr("y1", y1)
          .attr("x2", x2)
          .attr("y2", y2);

        return current_svg;
      }
    };

    overlay.onRemove = function() {
      this.layer.remove();
    }
  };
  // Bind our overlay to the map
  overlays.push(overlay);
  overlay.setMap(map);
}

function getGoogleCoords(links) {
  var geo_data = [];
  links.push(links[0]);
  for(var i=0; i < links.length; i++) {
    if(i > 0) {
      var start_lat = node_coord[links[i-1]][0];
      var start_lng = node_coord[links[i-1]][1];
      var target_lat = node_coord[links[i]][0];
      var target_lng = node_coord[links[i]][1];
      var diff = Math.abs(start_lng - target_lng);
      if(diff >= 180) {
        var lat_step = start_lat;
        var lng_step = start_lng;
        var lat_step_size = Math.abs(start_lat - target_lat) / 5.0;
        var lng_step_size = diff / 5.0;
        var lat_step_dir = 1.0;
        var lng_step_dir = 1.0;
        if(start_lng > target_lng) {
          lng_step_dir = -1.0;
        }
        if(start_lat > target_lat) {
          lat_step_dir = -1.0;
        }
        while((start_lng > target_lng && lng_step_dir < 0)
            || (start_lng < target_lng && lng_step_dir > 0)) {
          start_lat += (lat_step_size * lat_step_dir);
          start_lng += (lng_step_size * lng_step_dir);
          geo_data.push(new google.maps.LatLng(
            start_lat
            , start_lng
          ));
        }
      }
    }
    geo_data.push(new google.maps.LatLng(
      node_coord[links[i]][0]
      , node_coord[links[i]][1]
    ));
  }
  // geo_data.push(geo_data[0]);
  return geo_data;
}

// mark up for d3.geo polygons
function transformToGeoCollection(documents) {
  var geo_data = {"type":"FeatureCollection","features":[]};
  for(var i = 0; i < documents.length; i++) {
    if(documents[i].links.length > 0) {
      geo_data["features"].push(transformToGeoFeature(documents[i]));
    }
  }
  return geo_data;
}

// markup for geo feature coordinates
function transformToGeoFeature(d) {
  var geo_loc = [];
  for(var i=0; i < d.links.length; i++) {
    // for whatever reason, lat lng is reversed in d3.geo
    geo_loc.push([node_coord[d.links[i]][1], node_coord[d.links[i]][0]]);
  }
  // need to close the polygon by returning to first node
  geo_loc.push(geo_loc[0]);
  return {
    "type":"Feature"
    ,"properties":{"name":d.affiliation}
    ,"geometry":{
      "type":"Polygon"
      ,"coordinates":[geo_loc]}
      ,"id":"AFG"
  };
}

// draw a widget box displaying info regarding a node
function pushInfoWidget(d) {
  if($("#winfo-" + d.documentid).length > 0) {
    return false;
  }
  var html = "<div class='tool-box-widget' id='winfo-" + d.documentid + "'>\
    <span class='widget-close' onclick='$(this).parent().remove();'>x</span>" +
    "<h2>" + d.title + "</h2>" +
    "<p>Journal: " + d.journal + "<br/>" +
    "Author: " + d.author + "<br/>" +
    "Year: " + d.year + "<br/>" +
    "Period: " + d.period + "</p>" +
    "</div>";

  $("#tool-box").append(html);
  openSideBar();
  return true;
}

// open the side bar if it is not already open
function openSideBar() {
  var right_offset = +$("#tool-box").css("right").replace("px","");
  if(right_offset < 0) {
    toggleSideBar();
  }
}

// close the side bar if it is not already closed
function closeSideBar() {
  var right_offset = +$("#tool-box").css("right").replace("px","");
  if(right_offset == 0) {
    toggleSideBar();
  }
}

// toggle the side bar open or closed
function toggleSideBar() {
  var right_offset = +$("#tool-box").css("right").replace("px","");
  if(right_offset < 0) {
    $("#tool-box").css("right", 0);
  } else {
    $("#tool-box").css("right", -$("#tool-box").width()-15);
  }
}

// show node links for a specific node
function showLinks(node_id) {
  $("svg.links[doc-source='" + node_id + "']").show();
}

// hide any node links
function hideLinks(node_id) {
  if(typeof(node_id) == "undefined") {
    $("svg.links").hide();
  } else {
    $("svg.links[doc-source='" + node_id + "']").hide();
  }
}

$(document).ready(function() {
  $("#tool-box").width($(window).width() * 0.2);
  // Load the station data. When the data comes back, create an overlay.
  d3.json("/entities", function(error, data) {
    if (error) throw error;
    map_data = data;
    update(map_data);
    // filterJournals();
  });
});
