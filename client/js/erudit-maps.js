// Create the Google Map…
var map = new google.maps.Map(d3.select("#map").node(), {
  zoom: 5,
  minZoom: 3,
  maxZoom: 6,
  center: new google.maps.LatLng(55, -72),
  mapTypeId: google.maps.MapTypeId.TERRAIN,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  zoomControl: true,
  zoomControlOptions: {
      position: google.maps.ControlPosition.LEFT_CENTER
  }
  });

// Load the station data. When the data comes back, create an overlay.
d3.json("stations.json", function(error, data) {
  if (error) throw error;

  var overlay = new google.maps.OverlayView();

  // Add the container when the overlay is added to the map.
  overlay.onAdd = function() {
    var layer = d3.select(this.getPanes().overlayMouseTarget).append("div")
        .attr("class", "stations");
    var node_coord = {};
    // Draw each marker as a separate SVG element.
    // We could use a single SVG, but what size would it have?
    overlay.draw = function() {
      var radius = 1;
      var projection = this.getProjection(),
          padding = 10;
      // create an svg for each node and apply actions
      var marker = layer.selectAll("svg")
          .data(d3.entries(data.documents))
          .each(transform) // update existing markers
        .enter().append("svg")
          .each(transform)
          .attr("class", "marker")
          .attr("id", function(d) {
            return "map-node-" + d.key;
          })
          .on("mouseover", function(d) {
              d3.select(this).selectAll("circle").attr({
                fill: "orange",
                r:  9
              });
          })
          .on("mouseout", function(d) {
            d3.select(this).selectAll("circle").attr({
              fill: "brown",
              r:  4.5
            });
          })
          .on("click", function(d) {
            if(pushInfoWidget(d)) {

            }
          });

      // Add a circle.
      marker.append("circle")
          .attr("r", 4.5)
          .attr("cx", padding)
          .attr("cy", padding);
      // draw lines between links
      var markerLink = layer.selectAll(".links")
        .data(data.links)
        .each(pathTransform) // update existing markers
        .enter().append("svg:svg")
        .attr("class", "links")
        .each(pathTransform);

        // draw links between nodes
      function pathTransform(d) {
        var t, b, l, r, w, h, current_svg;
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
          .style("height", (b - t - radius) + "px");
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
          .style("stroke", "black")
          .attr("x1", x1)
          .attr("y1", y1)
          .attr("x2", x2)
          .attr("y2", y2)
          .attr("class", "link-" + d.source)
          .attr("id", "link-" + d.source + "-" + d.target);
        return current_svg;
      }

      // transform d by projecting lat and lng values to x y coords
      function transform(d) {
        node_coord[d.key] = [d.value["lat"], d.value["lng"]];
        d = new google.maps.LatLng(d.value["lat"], d.value["lng"]);
        d = projection.fromLatLngToDivPixel(d);
        return d3.select(this)
            .style("left", (d.x - padding) + "px")
            .style("top", (d.y - padding) + "px");
      }
    };
  };

  // Bind our overlay to the map…
  overlay.setMap(map);
});

// draw a widget box displaying info regarding a node
function pushInfoWidget(d) {
  if($("#winfo-" + d.key).length > 0) {
    return false;
  }
  var html = "<div class='tool-box-widget' id='winfo-" + d.key + "'>\
    <span class='widget-close' onclick='$(this).parent().remove();'>x</span>" +
    "<h2>" + d.value["title"] + "</h2>" +
    "<p>Journal: " + d.value["journal"] + "<br/>" +
    "Author: " + d.value["author"] + "<br/>" +
    "Year: " + d.value["year"] + "<br/>" +
    "Period: " + d.value["period"] + "</p>" +
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

$(document).ready(function() {
  $("#tool-box").width($(window).width() * 0.2);
});
