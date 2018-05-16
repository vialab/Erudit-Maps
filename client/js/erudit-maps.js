var $map = $("#map");

var geoJson = provinces();

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
  var geo_data = provinces();
  var overlay = new google.maps.OverlayView();
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

      // Turn the overlay projection into a d3 projection
      var googleMapProjection = function (coordinates) {
          var googleCoordinates = new google.maps.LatLng(coordinates[1], coordinates[0]);
          var pixelCoordinates = projection.fromLatLngToDivPixel(googleCoordinates);
          return [pixelCoordinates.x + 4000, pixelCoordinates.y + 4000];
      }

      path = d3.geo.path().projection(googleMapProjection);
      adminDivisions.selectAll("path")
          .data(geoJson.features)
          .attr("d", path) // update existing paths
      .enter().append("svg:path")
          .attr("d", path);

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

            }
          });

      // Add a circle.
      marker.append("circle")
          .attr("r", 4.5)
          .attr("cx", padding)
          .attr("cy", padding)
          .attr("fill", function(d) { return color_scale(d.entityid); });


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
  // Bind our overlay to the map…
  overlays.push(overlay);
  overlay.setMap(map);
}


function provinces() {
  return {"type":"FeatureCollection","features":[{
    "type":"Feature","properties":{"name":"Afghanistan"},"geometry":{"type":"Polygon","coordinates":[[[61.210817,35.650072],[62.230651,35.270664],[62.984662,35.404041],[63.193538,35.857166],[63.982896,36.007957],[64.546479,36.312073],[64.746105,37.111818],[65.588948,37.305217],[65.745631,37.661164],[66.217385,37.39379],[66.518607,37.362784],[67.075782,37.356144],[67.83,37.144994],[68.135562,37.023115],[68.859446,37.344336],[69.196273,37.151144],[69.518785,37.608997],[70.116578,37.588223],[70.270574,37.735165],[70.376304,38.138396],[70.806821,38.486282],[71.348131,38.258905],[71.239404,37.953265],[71.541918,37.905774],[71.448693,37.065645],[71.844638,36.738171],[72.193041,36.948288],[72.63689,37.047558],[73.260056,37.495257],[73.948696,37.421566],[74.980002,37.41999],[75.158028,37.133031],[74.575893,37.020841],[74.067552,36.836176],[72.920025,36.720007],[71.846292,36.509942],[71.262348,36.074388],[71.498768,35.650563],[71.613076,35.153203],[71.115019,34.733126],[71.156773,34.348911],[70.881803,33.988856],[69.930543,34.02012],[70.323594,33.358533],[69.687147,33.105499],[69.262522,32.501944],[69.317764,31.901412],[68.926677,31.620189],[68.556932,31.71331],[67.792689,31.58293],[67.683394,31.303154],[66.938891,31.304911],[66.381458,30.738899],[66.346473,29.887943],[65.046862,29.472181],[64.350419,29.560031],[64.148002,29.340819],[63.550261,29.468331],[62.549857,29.318572],[60.874248,29.829239],[61.781222,30.73585],[61.699314,31.379506],[60.941945,31.548075],[60.863655,32.18292],[60.536078,32.981269],[60.9637,33.528832],[60.52843,33.676446],[60.803193,34.404102],[61.210817,35.650072]]]},"id":"AFG"},
    {"type":"Feature","properties":{"name":"Angola"},"geometry":{"type":"MultiPolygon","coordinates":[[[[16.326528,-5.87747],[16.57318,-6.622645],[16.860191,-7.222298],[17.089996,-7.545689],[17.47297,-8.068551],[18.134222,-7.987678],[18.464176,-7.847014],[19.016752,-7.988246],[19.166613,-7.738184],[19.417502,-7.155429],[20.037723,-7.116361],[20.091622,-6.94309],[20.601823,-6.939318],[20.514748,-7.299606],[21.728111,-7.290872],[21.746456,-7.920085],[21.949131,-8.305901],[21.801801,-8.908707],[21.875182,-9.523708],[22.208753,-9.894796],[22.155268,-11.084801],[22.402798,-10.993075],[22.837345,-11.017622],[23.456791,-10.867863],[23.912215,-10.926826],[24.017894,-11.237298],[23.904154,-11.722282],[24.079905,-12.191297],[23.930922,-12.565848],[24.016137,-12.911046],[21.933886,-12.898437],[21.887843,-16.08031],[22.562478,-16.898451],[23.215048,-17.523116],[21.377176,-17.930636],[18.956187,-17.789095],[18.263309,-17.309951],[14.209707,-17.353101],[14.058501,-17.423381],[13.462362,-16.971212],[12.814081,-16.941343],[12.215461,-17.111668],[11.734199,-17.301889],[11.640096,-16.673142],[11.778537,-15.793816],[12.123581,-14.878316],[12.175619,-14.449144],[12.500095,-13.5477],[12.738479,-13.137906],[13.312914,-12.48363],[13.633721,-12.038645],[13.738728,-11.297863],[13.686379,-10.731076],[13.387328,-10.373578],[13.120988,-9.766897],[12.87537,-9.166934],[12.929061,-8.959091],[13.236433,-8.562629],[12.93304,-7.596539],[12.728298,-6.927122],[12.227347,-6.294448],[12.322432,-6.100092],[12.735171,-5.965682],[13.024869,-5.984389],[13.375597,-5.864241],[16.326528,-5.87747]]],[[[12.436688,-5.684304],[12.182337,-5.789931],[11.914963,-5.037987],[12.318608,-4.60623],[12.62076,-4.438023],[12.995517,-4.781103],[12.631612,-4.991271],[12.468004,-5.248362],[12.436688,-5.684304]]]]},"id":"AGO"},
    {"type":"Feature","properties":{"name":"Albania"},"geometry":{"type":"Polygon","coordinates":[[[20.590247,41.855404],[20.463175,41.515089],[20.605182,41.086226],[21.02004,40.842727],[20.99999,40.580004],[20.674997,40.435],[20.615,40.110007],[20.150016,39.624998],[19.98,39.694993],[19.960002,39.915006],[19.406082,40.250773],[19.319059,40.72723],[19.40355,41.409566],[19.540027,41.719986],[19.371769,41.877548],[19.304486,42.195745],[19.738051,42.688247],[19.801613,42.500093],[20.0707,42.58863],[20.283755,42.32026],[20.52295,42.21787],[20.590247,41.855404]]]},"id":"ALB"},
    {"type":"Feature","properties":{"name":"United Arab Emirates"},"geometry":{"type":"Polygon","coordinates":[[[51.579519,24.245497],[51.757441,24.294073],[51.794389,24.019826],[52.577081,24.177439],[53.404007,24.151317],[54.008001,24.121758],[54.693024,24.797892],[55.439025,25.439145],[56.070821,26.055464],[56.261042,25.714606],[56.396847,24.924732],[55.886233,24.920831],[55.804119,24.269604],[55.981214,24.130543],[55.528632,23.933604],[55.525841,23.524869],[55.234489,23.110993],[55.208341,22.70833],[55.006803,22.496948],[52.000733,23.001154],[51.617708,24.014219],[51.579519,24.245497]]]},"id":"ARE"
  }]};
}

function getGeoData(documents) {
  var geo_data = {"type":"FeatureCollection","features":[]};
  for(var i = 0; i < documents.length; i++) {
    if(documents[i].links.length > 2) {
      geo_data["features"].push(transformToGeoFeature(documents[i]));
    }
  }
  return geo_data;
}

// form links into geo path data structures
function transformToGeoFeature(d) {
  var coords = [];
  for(var i = 0; i < d.links.length; i++) {
    coords.push(node_coord[d.links[i]]);
  }
  coords.push(node_coord[d.links[0]]);
  return {
    "type": "Feature"
    , "properties": {"name": d.affiliation }
    , "geometry": {
        "type":"Polygon"
        , "coordinates":[coords]
      }
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
