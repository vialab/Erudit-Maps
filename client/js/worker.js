importScripts("../js/bubblesets.js");
//e parameter has this contained: e.data.data, e.data.nodeCoords, e.data.projection, e.data.thread_id
onmessage = e => {
  let bubbleSet = new BubbleSet();
  let bubbleSetPadding = 4.5;
  let zoomCache = e.data.zoom;
  var keys = Object.keys(e.data.entities);
  result = [];
  keyList = [];
  if (e.data.thread_id < 3) {
    for (
      var i = Math.floor(e.data.links.length / 4) * e.data.thread_id;
      i < Math.floor(e.data.links.length / 4) * (e.data.thread_id + 1);
      i++
    ) {
      //calculate the difference between the two sets
      //based on the current group
      let diffSetKeys = keys.filter(x => {
        return !e.data.links[i].includes(parseInt(x));
      });
      var diff = [];
      var target = [];
      for (var j = 0; j < diffSetKeys.length; j++) {
        var tmp = projectToPixels(
          {
            lat: e.data.entities[diffSetKeys[j]].lat,
            lng: e.data.entities[diffSetKeys[j]].lng
          },
          zoomCache
        );
        diff.push({ x: tmp.x, y: tmp.y, width: 4.5, height: 4.5 });
      }
      for (var j = 0; j < e.data.links[i].length; j++) {
        var tmp = projectToPixels(
          {
            lat: e.data.entities[e.data.links[i][j]].lat,
            lng: e.data.entities[e.data.links[i][j]].lng
          },
          zoomCache
        );
        target.push({ x: tmp.x, y: tmp.y, width: 4.5, height: 4.5 });
      }
      //create the outline
      var list = bubbleSet.createOutline(
        BubbleSet.addPadding(target, bubbleSetPadding),
        BubbleSet.addPadding(diff, bubbleSetPadding),
        null
      );
      //calculate the list
      var outline = new PointPath(list).transform([
        new ShapeSimplifier(0.0),
        new BSplineShapeGenerator(),
        new ShapeSimplifier(0.0)
      ]);
      //create key
      key = "";
      for (var j = 0; j < e.data.links[i].length; j++) {
        key += `${e.data.links[i][j]},`;
      }
      key = key.slice(0, -1);
      keyList.push(key);
      result.push(outline);
    }
  } else {
    for (
      var i = Math.floor(e.data.links.length / 4) * e.data.thread_id;
      i < e.data.links.length;
      i++
    ) {
      let diffSetKeys = keys.filter(x => {
        return !e.data.links[i].includes(parseInt(x));
      });
      var diff = [];
      var target = [];
      for (var j = 0; j < diffSetKeys.length; j++) {
        var tmp = projectToPixels(
          {
            lat: e.data.entities[diffSetKeys[j]].lat,
            lng: e.data.entities[diffSetKeys[j]].lng
          },
          zoomCache
        );
        diff.push({ x: tmp.x, y: tmp.y, width: 4.5, height: 4.5 });
      }
      for (var j = 0; j < e.data.links[i].length; j++) {
        var tmp = projectToPixels(
          {
            lat: e.data.entities[e.data.links[i][j]].lat,
            lng: e.data.entities[e.data.links[i][j]].lng
          },
          zoomCache
        );
        target.push({ x: tmp.x, y: tmp.y, width: 4.5, height: 4.5 });
      }

      var list = bubbleSet.createOutline(
        BubbleSet.addPadding(target, bubbleSetPadding),
        BubbleSet.addPadding(diff, bubbleSetPadding),
        null
      );
      var outline = new PointPath(list).transform([
        new ShapeSimplifier(0.0),
        new BSplineShapeGenerator(),
        new ShapeSimplifier(0.0)
      ]);
      //create key
      key = "";
      for (var j = 0; j < e.data.links[i].length; j++) {
        key += `${e.data.links[i][j]},`;
      }
      key = key.slice(0, -1);
      keyList.push(key);
      result.push(outline);
    }
  }

  polyLines = new Map();
  for (var i = 0; i < result.length; i++) {
    tmpOutline = [];
    result[i].forEach(d => {
      tmpOutline.push([d[0], d[1]]);
    });
    polyLines.set(keyList[i], tmpOutline);
  }
  console.log(`[worked thread ${e.data.thread_id}]: finished`);
  postMessage({ polyLines, worker_id: e.data.thread_id, zoom: zoomCache });
};

function projectToPixels(latLng, zoom) {
  const TILE_SIZE = 256;
  var siny = Math.sin((latLng.lat * Math.PI) / 180);

  // Truncating to 0.9999 effectively limits latitude to 89.189. This is
  // about a third of a tile past the edge of the world tile.
  siny = Math.min(Math.max(siny, -0.9999), 0.9999);

  return {
    x: TILE_SIZE * (0.5 + latLng.lng / 360) * zoom,
    y:
      TILE_SIZE *
      (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)) *
      zoom
  };
}
