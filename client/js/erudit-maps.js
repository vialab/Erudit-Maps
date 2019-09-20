var $map = $("#map");

// Create the Google Map…
var map = new google.maps.Map(d3.select("#map").node(), {
  zoom: 3,
  center: new google.maps.LatLng(55, -72),
  mapTypeId: google.maps.MapTypeId.ROADMAP,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  zoomControl: true,
  zoomControlOptions: {
    position: google.maps.ControlPosition.RIGHT_CENTER
  },

  styles: [
    {
      featureType: "administrative",
      elementType: "all",
      stylers: [
        {
          saturation: "-100"
        }
      ]
    },
    {
      featureType: "administrative.province",
      elementType: "all",
      stylers: [
        {
          visibility: "off"
        }
      ]
    },
    {
      featureType: "landscape",
      elementType: "all",
      stylers: [
        {
          saturation: -100
        },
        {
          lightness: 65
        },
        {
          visibility: "on"
        }
      ]
    },
    {
      featureType: "poi",
      elementType: "all",
      stylers: [
        {
          saturation: -100
        },
        {
          lightness: "50"
        },
        {
          visibility: "simplified"
        }
      ]
    },
    {
      featureType: "road",
      elementType: "all",
      stylers: [
        {
          saturation: "-100"
        }
      ]
    },
    {
      featureType: "road.highway",
      elementType: "all",
      stylers: [
        {
          visibility: "simplified"
        }
      ]
    },
    {
      featureType: "road.arterial",
      elementType: "all",
      stylers: [
        {
          lightness: "30"
        }
      ]
    },
    {
      featureType: "road.local",
      elementType: "all",
      stylers: [
        {
          lightness: "40"
        }
      ]
    },
    {
      featureType: "transit",
      elementType: "all",
      stylers: [
        {
          saturation: -100
        },
        {
          visibility: "simplified"
        }
      ]
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [
        {
          hue: "#ffff00"
        },
        {
          lightness: 30
        },
        {
          saturation: -100
        }
      ]
    },
    {
      featureType: "water",
      elementType: "labels",
      stylers: [
        {
          lightness: -25
        },
        {
          saturation: -100
        }
      ]
    }
  ]
});
var overlays = [];
var map_data;
var filter_data;
var colors = [
  "#e07b91",
  "#d33f6a",
  "#11c638",
  "#8dd593",
  "#c6dec7",
  "#ead3c6",
  "#f0b98d",
  "#ef9708",
  "#0fcfc0",
  "#9cded6",
  "#d5eae7",
  "#f3e1eb",
  "#f6c4e1",
  "#f79cd4",
  "#023fa5",
  "#7d87b9",
  "#bec1d4",
  "#d6bcc0",
  "#bb7784",
  "#8e063b",
  "#4a6fe3",
  "#8595e1",
  "#b5bbe3",
  "#e6afb9"
];
var color_scale = d3.scale.ordinal().range(colors);
var renderBuffer = new RenderBuffer();
var jobSystem = new JobTaskSystem();
var node_coord = {};
var setsToRender = [];
var keyMap = new Map();
var filters = [];
var links;
var bubbleset = new BubbleSet();
//overlay variables
var overlay;
var layer;
var svg;
var adminDivisions;
var padding = 10;
//bubbleset values
var bubbleSetOutlineThickness = 1;
var bubbleSetOpacity = 0.35;
var myData = null;
var quadTree;
//function callbacks based on if the map is loaded or not
var updateDataFunction = updateData;
//do nothing until map is loaded
var updateMapFunction = function(data) {};
//map listener used once for loading
var loadListener;
//On webpage load
//This should init the google maps overlay and request the api
//this should also bind all of the overlay functions
function onLoad() {
  loadListener = map.addListener("tilesloaded", () => {
    //updateDataFunction = updateData;
    updateMapFunction = updateMap;
    overlay.draw = drawOverlay;
    console.log("tilesloaded");
    links = checkForDuplicates(myData.documents);
    buildKeyMap(links);
    update(myData);
    google.maps.event.removeListener(loadListener);
    map.addListener("zoom_changed", onZoom);
  });
  overlay = new google.maps.OverlayView();
  overlay.onAdd = function() {
    overlay.layer = d3
      .select(overlay.getPanes().overlayMouseTarget)
      .append("div")
      .attr("class", "stations");

    layer = d3
      .select(overlay.getPanes().overlayLayer)
      .append("div")
      .attr("class", "SvgOverlay");
    svg = layer.append("svg");
    adminDivisions = svg.append("g").attr("class", "AdminDivisions");
    projection = this.getProjection();
    overlay.draw = function() {};
    // Bind our overlay to the map
    overlay.onRemove = function() {
      this.layer.remove();
    };
    console.log("onAdd finished");
  };
  overlay.setMap(map);
}

// d3 update map
function update(data) {
  updateDataFunction(data);
  updateMapFunction(data);
}
//updates the map based on the data received. This function is called once the map tiles have finished loading on the page.
function updateMap(data) {
  overlay.layer.selectAll("svg").remove();
  var marker = overlay.layer
    .selectAll("svg")
    .data(d3.values(data.entities))
    .each(transform) // update existing markers
    .enter()
    .append("svg")
    .each(transform)
    .attr("class", "marker")
    .attr("doc-id", function(d) {
      return d.entityid;
    })
    .attr("journal-id", function(d) {
      return d.entityid;
    })
    .on("mouseover", function(d) {
      d3.select(this)
        .selectAll("circle")
        .attr("r", 9)
        .attr("fill", "rgba(63, 184, 175, 0.8)")
        .style("stroke", "rgba(63, 184, 175, 1)");
      var keys = keyMap.get(d.entityid);
      for (var i = 0; i < keys.length; i++) {
        for (var j = 0; j < keys[i].length; j++) {
          let key = keys[i][j];
          overlay.layer
            .select(`[doc-id="${key}"]`)
            .select("circle")
            .attr("r", 9)
            .attr("fill", "rgba(63, 184, 175, 0.8)")
            .style("stroke", "rgba(63, 184, 175, 1)");
        }
      }
      setsToRender.push(keys);
      renderRequestedSets();
    })
    .on("mouseout", function(d) {
      d3.select(this)
        .selectAll("circle")
        .attr("r", 4.5)
        .attr("fill", rgb_highlight(d.entityid))
        .style("stroke", rgb_highlight);
      var keys = keyMap.get(d.entityid);
      for (var i = 0; i < keys.length; i++) {
        for (var j = 0; j < keys[i].length; j++) {
          let key = keys[i][j];
          overlay.layer
            .select(`[doc-id="${key}"]`)
            .selectAll("circle")
            .attr("r", 4.5)
            .attr("fill", rgb_highlight(key))
            .style("stroke", rgb_highlight);
        }
      }
      renderAppliedFilter();
    })
    .on("click", function(d) {
      openDocumentsBar(d.entityid, d.affiliation);
    });

  //// Add a circle.
  marker
    .append("circle")
    .attr("r", 4.5)
    .attr("cx", padding)
    .attr("cy", padding)
    .attr("fill", function(d) {
      return rgb_highlight(d.entityid);
    })
    .attr("stroke", function(d) {
      if (rgb_highlight(d.entityid) != rgb_default) {
        return "#000";
      } else {
        return rgb_stroke;
      }
    });

  $("svg circle").tipsy({
    gravity: "w",
    html: true,
    title: function() {
      var d = this.__data__;
      return d.affiliation;
    }
  });

  $("svg circle").mousemove(function(event) {
    $(".tipsy").css("left", event.pageX + 16 + "px");
    $(".tipsy").css("top", event.pageY - 16 + "px");
  });

  var entities = Object.values(data.entities);
  filters = [];
  links = checkForDuplicates(myData.documents);
  buildKeyMap(links);
  console.time("async");
  for (var i = 0; i < entities.length; i++) {
    //NodeSet.push([entities[i].lat, entities[i].lng]);
    filters.push(entities[i].entityid);
  }
  doWork(myData.entities, links, 1 << map.getZoom(), work.NEW_DATA);
}
//create quad tree of data used to calculate the neighbours for the bubbleSet later.
function createQuadTree(entities) {
  var data = [];
  for (var i = 0; i < entities.length; i++) {
    let tmp = projection.fromLatLngToContainerPixel(
      new google.maps.LatLng(entities[i].lat, entities[i].lng)
    );
    data.push({ id: entities[i].entityid, x: tmp.x, y: tmp.y });
  }
  quadtree = d3
    .quadtree()
    .x(d => {
      return d.x;
    })
    .y(d => {
      return d.y;
    })
    .addAll(data);
}
//aggregate all of the data being pushed before we are able to process
function updateDataBeforeMapLoad(data) {
  myData = { ...myData, ...data };
}
//regular update data function when the map is loaded
function updateData(data) {
  myData = data;
}
//builds key map that is used for the onHover only display the sets relative to this node
function buildKeyMap(links) {
  keyMap.clear();
  for (var i = 0; i < links.length; i++) {
    for (var j = 0; j < links[i].length; j++) {
      if (keyMap.has(links[i][j])) {
        keyMap.get(links[i][j]).push(links[i]);
      } else {
        keyMap.set(links[i][j], []);
        keyMap.get(links[i][j]).push(links[i]);
      }
    }
  }
}
function onZoom() {
  console.log("zoom");
  console.log(myData.entities);
  doWork(myData.entities, links, 1 << map.getZoom(), work.ZOOM);
}

function checkForDuplicates(data) {
  let collisionMap = new Map();
  for (var i = 0; i < data.length; i++) {
    if (collisionMap.has(`${data[i].links}`)) {
      collisionMap.set(
        `${data[i].links}`,
        collisionMap.get(`${data[i].links}`) + 1
      );
      continue;
    }
    collisionMap.set(`${data[i].links}`, 1);
  }
  collisionFreeLinks = [];
  collisionMap.forEach((value, key) => {
    values = key.split(",");
    tmp = [];
    for (var i = 0; i < values.length; i++) {
      tmp.push(parseInt(values[i]));
    }
    collisionFreeLinks.push(tmp);
  });
  return collisionFreeLinks;
}

async function doWork(entities, links, zoom, work) {
  jobSystem.setCallBack(onMessage);
  jobSystem.setOnFinishedCallback(render);
  jobSystem.queueWork(work, {
    entities: entities,
    links: links,
    zoom: zoom
  });
}

function onMessage(event) {
  event.data.polyLines.forEach((value, key) => {
    tmp = [];
    value.forEach(d => {
      let coords = map
        .getProjection()
        .fromPointToLatLng(
          new google.maps.Point(d[0] / event.data.zoom, d[1] / event.data.zoom)
        );
      tmp.push({ lat: coords.lat(), lng: coords.lng() });
    });
    renderBuffer.getBackBuffer().set(
      key,
      new google.maps.Polygon({
        path: tmp,
        strokeColor: "#000000",
        strokeOpacity: 0.5,
        strokeWeight: bubbleSetOutlineThickness,
        fillColor: color_scale(Math.random(0, 100) % 23),
        fillOpacity: bubbleSetOpacity,
        geodesic: false
      })
    );
  });
}

function renderAppliedFilter() {
  for (var i = 0; i < filters.length; i++) {
    if (keyMap.has(filters[i])) {
      const keys = keyMap.get(filters[i]);
      for (var j = 0; j < keys.length; j++) {
        renderBuffer
          .getFrontBuffer()
          .get(keys[j].toString())
          .setMap(map);
      }
    }
  }
}

function renderRequestedSets() {
  renderBuffer.getFrontBuffer().forEach((value, key) => {
    value.setMap(null);
  });
  for (var i = 0; i < setsToRender.length; i++) {
    for (var j = 0; j < setsToRender[i].length; j++) {
      if (renderBuffer.getFrontBuffer().has(setsToRender[i][j].toString())) {
        renderBuffer
          .getFrontBuffer()
          .get(setsToRender[i][j].toString())
          .setMap(map);
      }
    }
  }
  setsToRender = [];
}

function render() {
  renderBuffer.switchFrontBuffer();
  renderBuffer.clearBackBuffer();
  renderBuffer.getFrontBuffer().forEach((value, key) => {
    value.setMap(map);
  });
  console.timeEnd("async");
}

//transforms markers from lat,lng to pixels based on the maps projection
function transform(d) {
  node_coord[d.entityid] = [d.lat, d.lng];
  d = new google.maps.LatLng(d.lat, d.lng);
  d = projection.fromLatLngToDivPixel(d);
  return d3
    .select(this)
    .style("left", d.x - padding + "px")
    .style("top", d.y - padding + "px")
    .style("z-index", 99);
}

//gets the lat, lng based on entityID in object format [{lat:,lng:}]
function getCoords(links) {
  var coords = [];
  for (var i = 0; i < links.length; i++) {
    coords.push({
      lat: node_coord[links[i]][0],
      lng: node_coord[links[i]][1]
    });
  }
  return coords;
}
//draws between the nodes in an arch
function drawLineNodes(data, i, coords) {
  if (data.documents[i].links.length < 3) {
    var polyline = new google.maps.Polygon({
      path: coords,
      geodesic: true,
      strokeColor: rgb_highlight(data.documents[i].entityid),
      strokeOpacity: 0.8,
      strokeWeight: 1
    });
    polylines.push(polyline);
  } else {
    var polygon = new google.maps.Polygon({
      paths: coords,
      strokeColor: rgb_highlight(data.documents[i].entityid),
      strokeOpacity: 0.5,
      strokeWeight: 1.5,
      fillColor: rgb_highlight(data.documents[i].entityid),
      fillOpacity: 0.1
    });
    polygons.push(polygon);
  }
}
//draws a line between the nodes in a straight line
function drawLineNodesStraight(data, i) {
  var coords = getGoogleCoords(data.documents[i].links);
  if (data.documents[i].links.length < 3) {
    var polyline = new google.maps.Polygon({
      path: coords,
      geodesic: true,
      strokeColor: rgb_highlight(data.documents[i].entityid),
      strokeOpacity: 0.8,
      strokeWeight: 1
    });
    polylines.push(polyline);
  } else {
    var polygon = new google.maps.Polygon({
      paths: coords,
      strokeColor: rgb_highlight(data.documents[i].entityid),
      strokeOpacity: 0.5,
      strokeWeight: 1.5,
      fillColor: rgb_highlight(data.documents[i].entityid),
      fillOpacity: 0.1
    });
    polygons.push(polygon);
  }
}

//draw functions for map -- might not have to clear overlays we will see
function drawOverlay() {
  //clearOverlays();
  //layer.selectAll("svg").each(transform);
  overlay.layer
    .selectAll("svg")
    .data(d3.values(myData.entities))
    .each(transform);
}
//defines 5 points between to geo-location which is used to create a straight line
function getGoogleCoords(links) {
  var geo_data = [];
  if (links.length > 1) {
    links.push(links[0]);
  }
  for (var i = 0; i < links.length; i++) {
    if (i > 0) {
      var start_lat = node_coord[links[i - 1]][0];
      var start_lng = node_coord[links[i - 1]][1];
      var target_lat = node_coord[links[i]][0];
      var target_lng = node_coord[links[i]][1];
      var diff = Math.abs(start_lng - target_lng);
      if (diff >= 180) {
        var lat_step = start_lat;
        var lng_step = start_lng;
        var lat_step_size = Math.abs(start_lat - target_lat) / 5.0;
        var lng_step_size = diff / 5.0;
        var lat_step_dir = 1.0;
        var lng_step_dir = 1.0;
        if (start_lng > target_lng) {
          lng_step_dir = -1.0;
        }
        if (start_lat > target_lat) {
          lat_step_dir = -1.0;
        }
        while (
          (start_lng > target_lng && lng_step_dir < 0) ||
          (start_lng < target_lng && lng_step_dir > 0)
        ) {
          start_lat += lat_step_size * lat_step_dir;
          start_lng += lng_step_size * lng_step_dir;
          geo_data.push(new google.maps.LatLng(start_lat, start_lng));
        }
      }
    }
    geo_data.push(
      new google.maps.LatLng(node_coord[links[i]][0], node_coord[links[i]][1])
    );
  }
  return geo_data;
}

// mark up for d3.geo polygons
function transformToGeoCollection(documents) {
  var geo_data = { type: "FeatureCollection", features: [] };
  for (var i = 0; i < documents.length; i++) {
    if (documents[i].links.length > 0) {
      geo_data["features"].push(transformToGeoFeature(documents[i]));
    }
  }
  return geo_data;
}

// markup for geo feature coordinates
function transformToGeoFeature(d) {
  var geo_loc = [];
  for (var i = 0; i < d.links.length; i++) {
    // for whatever reason, lat lng is reversed in d3.geo
    geo_loc.push([node_coord[d.links[i]][1], node_coord[d.links[i]][0]]);
  }
  // need to close the polygon by returning to first node
  geo_loc.push(geo_loc[0]);
  return {
    type: "Feature",
    properties: { name: d.affiliation },
    geometry: {
      type: "Polygon",
      coordinates: [geo_loc]
    },
    id: "AFG"
  };
}

// draw a widget box displaying info regarding a node
function pushInfoWidget(d) {
  if ($("#winfo-" + d.entityid).length > 0) {
    return false;
  }
  var html =
    "<div class='tool-box-widget' id='winfo-" +
    d.entityid +
    "'>\
    <span class='widget-close' onclick='$(this).parent().remove();'>x</span>" +
    "<h2>" +
    d.affiliation +
    "</h2>" +
    "<p>Address: " +
    d.addr +
    "<br/>" +
    "Lat: " +
    d.lat +
    "<br/>" +
    "Lng: " +
    d.lng +
    "<br/>" +
    "<button class='ui button' onclick='openDocumentsBar(" +
    d.entityid +
    ',"' +
    d.affiliation +
    "\")'>View Documents</button></div>";

  $("#tool-box").append(html);
  openSideBar();
  return true;
}

// open a modal to allow viewing of documents and filtration by author
function openDocumentsBar(entity_id, affiliation) {
  var documents = getDocumentsByEntity(entity_id);
  $("#doc-modal").modal("show");
  $("#doc-modal .header").html(affiliation);
  if (documents.length == 0) {
    $("#doc-content").hide();
    $("#no-doc").show();
    return;
  } else {
    $("#no-doc").hide();
    $("#doc-content").show();
  }
  var html = "";
  for (var i = 0; i < documents.length; i++) {
    var secondary_aff = map_data.entities[documents[i].entityid].affiliation;
    html +=
      "<div class='ui vertical segment doc-info'><h4>" +
      documents[i].title +
      "</h4>Author: " +
      documents[i].author +
      "<br/>";
    if (documents[i].entityid != entity_id && affiliation != secondary_aff) {
      html += "Affiliation: " + secondary_aff + "<br/>";
    }
    html +=
      "Journal: " +
      documents[i].journal +
      "<br/>" +
      "Year: " +
      documents[i].year +
      "</div><br/>";
  }
  $("#doc-list").append(html);
}

// open filter MODAL
function openFilterModal() {
  $("#filter-modal").modal("show");
}

// get all filtered documents in a specific journal
function getDocumentsByEntity(entity_id) {
  return $.grep(filter_data.documents, function(n, i) {
    if (n.entityid == entity_id || $.inArray(entity_id, n.links)) return true;
    return false;
  });
}

function getAuthors(documents) {
  var author_list = [];
  for (var i = 0; i < documents.length; i++) {
    var author_id = documents[i].authorid;
    if (!author_list.includes(author_id)) {
      author_list.push(author_id);
    }
  }
  return author_list;
}

// open the side bar if it is not already open
function openSideBar() {
  $("#toggle-widgets i").removeClass("right");
  $("#toggle-widgets i").addClass("left");
  $("#widget-cards").css("left", 0);
  if ($("#widget-cards").hasClass("opened")) {
    $("#toggle-widgets").css("left", 380);
  } else {
    $("#toggle-widgets").css("left", 370);
  }
}

// close the side bar if it is not already closed
function closeSideBar() {
  $("#toggle-widgets i").removeClass("left");
  $("#toggle-widgets i").addClass("right");
  $("#widget-cards").css("left", -$("#widget-cards").width() - 20);
  $("#toggle-widgets").css("left", -5);
}

// toggle the side bar open or closed
function toggleSideBar() {
  var left_offset = +$("#widget-cards")
    .css("left")
    .replace("px", "");
  if (left_offset < 0) {
    openSideBar();
  } else {
    closeSideBar();
  }
}

function openFilterBar() {
  $("#selected-filters .extra.content").hide();
  $("#widget-cards #close-card").show();
  $("#widget-cards").css("background-color", "#eee");
  $("#widget-cards").css("pointer-events", "auto");
  $("#widget-cards").css("overflow-y", "scroll");
  $("#widget-cards").addClass("opened");
  $("#widget-cards").addClass("shadow");
  $(".filter-widget").show();
  $("#selected-filters").css("max-height", "none");
  $("#toggle-widgets").css("left", 380);
}

function closeFilterBar() {
  $("#selected-filters .extra.content").show();
  $("#widget-cards #close-card").hide();
  $("#widget-cards").css("background-color", "rgba(255,255,255,0)");
  $("#widget-cards").css("pointer-events", "none");
  $("#widget-cards").css("overflow-y", "hidden");
  $("#widget-cards").removeClass("opened");
  $("#widget-cards").removeClass("shadow");
  $(".filter-widget").hide();
  $("#selected-filters").css("max-height", "280px");
  $("#toggle-widgets").css("left", 370);
}

function toggleFilterBar() {
  if ($("#widget-cards").hasClass("opened")) {
    closeFilterBar();
  } else {
    openFilterBar();
  }
}

// show node links for a specific node
function showLinks(node_id) {
  $("svg.links[doc-source='" + node_id + "']").show();
}

// hide any node links
function hideLinks(node_id) {
  if (typeof node_id == "undefined") {
    $("svg.links").hide();
  } else {
    $("svg.links[doc-source='" + node_id + "']").hide();
  }
}

$(document).ready(function() {
  $("#tool-box").width($(window).width() * 0.2);
  $("#filter-title").on("input", function() {
    applyFilters(false);
  });
  // Load the station data. When the data comes back, create an overlay.
  d3.json("/entities", function(error, data) {
    if (error) throw error;
    map_data = data;
    filter_data = map_data;
    extractDateRange(map_data.documents);
    extractJournalList(map_data.documents);
    extractJournalEntity(map_data.documents);
    author_data = extractAuthorList(map_data.documents);
    drawAuthorList();
    applyFilters(false);
  });
});
