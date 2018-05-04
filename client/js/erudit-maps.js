// Create the Google Map…
var map = new google.maps.Map(d3.select("#map").node(), {
  zoom: 5,
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

var map_data;
var overlays = [];
// d3 update map
function update(data) {
  // Add the container when the overlay is added to the map.
  var overlay = new google.maps.OverlayView();
  overlay.onAdd = function() {
    this.layer = d3.select(this.getPanes().overlayMouseTarget).append("div")
        .attr("class", "stations");
    var node_coord = {};
    // Draw each marker as a separate SVG element.
    // We could use a single SVG, but what size would it have?
    overlay.draw = function() {
      var radius = 1;
      var projection = this.getProjection(),
          padding = 10;
      // create an svg for each node and apply actions
      var marker = this.layer.selectAll("svg")
          .data(data.documents)
          .each(transform) // update existing markers
        .enter().append("svg")
          .each(transform)
          .attr("class", "marker")
          .attr("doc-id", function(d) {
            return d.documentid;
          })
          .attr("journal-id", function(d) {
            return d.journalid;
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
      var markerLink = this.layer.selectAll(".links")
        .data(data.links)
        .each(pathTransform) // update existing markers
        .enter().append("svg:svg")
        .attr("class", "links")
        .each(pathTransform);

      // transform d by projecting lat and lng values to x y coords
      function transform(d) {
        node_coord[d.documentid] = [d.lat, d.lng];
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
          .style("stroke", "black")
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
  // Bind our overlay to the map…
  overlays.push(overlay);
  overlay.setMap(map);
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

// show all nodes within a journal
function showJournalLinks(journal_id) {
  hideLinks();
  $("svg.marker[journal-id='" + journal_id + "']").each(function() {
    $("svg.links[doc-source='" + $(this).attr("doc-id") + "']").each(function() {
      showNode($(this).attr("doc-target"));
    });
  });
}

// show all nodes within selected set of journal
function filterJournals() {
  while(overlays.length > 0) {
    overlays.pop().setMap(null);
  }
  var selected_journals = $("select#journal-list").val();
  var documents = $.grep(map_data.documents, function(n, i) {
    if($.inArray(n.journalid+"", selected_journals) > -1) {
      return true
    }
    return false;
  });
  var new_data = {"documents":documents, "links":[]};
  console.log(new_data);
  update(new_data);
}

$(document).ready(function() {
  $("#tool-box").width($(window).width() * 0.2);
  // Load the station data. When the data comes back, create an overlay.
  d3.json("/entities", function(error, data) {
    if (error) throw error;
    map_data = data;
    // update(data);
    filterJournals();
  });
});
