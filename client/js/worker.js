importScripts("../js/bubblesets.js");
//e parameter has this contained: e.data.data, e.data.nodeCoords, e.data.projection, e.data.thread_id
onmessage = e => {
  let bubbleSet = new BubbleSet();
  result = [];
  keyList = [];
  if (e.data.thread_id < 3) {
    for (
      var i = Math.floor(e.data.targetSet.length / 4) * e.data.thread_id;
      i < Math.floor(e.data.targetSet.length / 4) * (e.data.thread_id + 1);
      i++
    ) {
      //calculate the difference between the two sets
      //based on the current group
      let diffSet = e.data.diffSet.filter(x => {
        return !e.data.targetSet[i].includes(x);
      });
      //create the outline
      var list = bubbleSet.createOutline(
        BubbleSet.addPadding(e.data.targetSet[i], 10),
        BubbleSet.addPadding(diffSet, 10),
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
      for (var j = 0; j < e.data.ids[i].length; j++) {
        key += `${e.data.ids[i][j]},`;
      }
      key = key.slice(0, -1);
      keyList.push(key);
      result.push(outline);
    }
  } else {
    for (
      var i = Math.floor(e.data.targetSet.length / 4) * e.data.thread_id;
      i < e.data.targetSet.length;
      i++
    ) {
      let diffSet = e.data.diffSet.filter(x => {
        return !e.data.targetSet[i].includes(x);
      });
      var list = bubbleSet.createOutline(
        BubbleSet.addPadding(e.data.targetSet[i], 10),
        BubbleSet.addPadding(diffSet, 10),
        null
      );
      var outline = new PointPath(list).transform([
        new ShapeSimplifier(0.0),
        new BSplineShapeGenerator(),
        new ShapeSimplifier(0.0)
      ]);
      //create key
      key = "";
      for (var j = 0; j < e.data.ids[i].length; j++) {
        key += `${e.data.ids[i][j]},`;
      }
      key = key.slice(0, -1);
      keyList.push(key);
      result.push(outline);
    }
  }
  //console.log(keyList);
  polyLines = new Map();
  for (var i = 0; i < result.length; i++) {
    tmpOutline = [];
    result[i].forEach(d => {
      tmpOutline.push([d[0], d[1]]);
    });
    polyLines.set(keyList[i], tmpOutline);
  }
  //result.forEach(x => {
  //  tmpOutline = [];
  //  x.forEach(d => {
  //    tmpOutline.push([d[0], d[1]]);
  //  });
  //  polyLines.push(tmpOutline);
  //});
  console.log(`[worked thread ${e.data.thread_id}]: finished`);
  postMessage(polyLines);
};
