var journal = {};
var journal_data = {};
var selected_journals = [];
d3.json("/journal", function(error, data) {
  journal = data;
  // drawJournalList();
});

// draw the journal select list
function drawJournalList() {
  $("#journal-list option").remove();
  var html = "";
  for(var key in journal_data) {
    // check if we've already selected this journal
    if($.inArray(key+"", selected_journals) > -1) {
      continue;
    }
    var j = journal_data[key];
    var docs = j.count ? j.count : 0;
    html += "<option value='" + key + "'>"
      + j.title + " (" + docs + ")</option>";
  }

  $("#journal-list").append(html);
}

// write the list of selected journals to the filter list
function drawSelectedJournals() {
  for(var i=0; i<selected_journals.length; i++) {
    if($("#journal-filter li[journal-id='"
        + selected_journals[i] + "']").length > 0) {
      continue;
    }
    var id = selected_journals[i];
    var data = journal[selected_journals[i]];
    var html = "<li class='filter-item' journal-id='"
      + id + "'><span class='filter-legend' \
      style='background-color:" + color_scale(id)
      + ";'></span>" + data.title + " (" + data.count + ")\
      <span class='filter-close' \
      onclick='removeJournalFilter(this)'>x</span></li>";
    $("ul#journal-filter").append(html);
  }

  $(".filter-item").on("mouseover", function() {
    var journal_id = $(this).attr("journal-id");
    var svg = d3.selectAll("svg[journal-id='" + journal_id + "']");
    svg.selectAll("circle").style("stroke", rgb_highlight)
      .style("z-index", 999);
    svg.each(function(d) {
      d3.selectAll("svg.links[doc-target='" + d.documentid + "']")
        .selectAll("line")
        .style("stroke", rgb_highlight)
        .style("z-index", 999);
      d3.selectAll("svg.links[doc-source='" + d.documentid + "']")
        .selectAll("line")
        .style("stroke", rgb_highlight)
        .style("z-index", 999);
    });
  });

  $(".filter-item").on("mouseout", function() {
    var journal_id = $(this).attr("journal-id");
    var svg = d3.selectAll("svg[journal-id='" + journal_id + "']");
    svg.selectAll("circle").style("stroke", rgb_highlight)
      .style("z-index", "auto");
    svg.each(function(d) {
      d3.selectAll("svg.links[doc-target='" + d.documentid + "']")
        .selectAll("line")
        .style("stroke", rgb_stroke)
        .style("z-index", "auto");
      d3.selectAll("svg.links[doc-source='" + d.documentid + "']")
        .selectAll("line")
        .style("stroke", rgb_stroke)
        .style("z-index", "auto");
    });
  });
}

// remove from selected journal list
function removeJournalFilter(elem) {
  var $parent = $(elem).parent();
  var journal_id = $parent.attr("journal-id");
  $parent.remove();

  selected_journals = selected_journals.filter(function(item) {
    return item != journal_id;
  });

  applyFilters(true);
}

// show all nodes within selected set of journal
function filterJournals(data, queued) {
  // filter map_data with docs just in our selected journals
  selected_journals = selected_journals.concat($("select#journal-list").val());
  var entity_list = [];
  var documents = $.grep(data.documents, function(n, i) {
    if($.inArray(n.journalid+"", selected_journals) > -1) {
      if($.inArray(n.entityid+"", entity_list) == -1) {
        entity_list.push(n.entityid);
      }
      return true
    }
    return false;
  });
  // filter links such that both documents are in selected journals
  var entities = {};
  for(var id in entity_list) {
    entities[entity_list[id]] = data.entities[entity_list[id]];
  }
  var new_data = {"documents":documents, "entities":entities};
  // remove selected journals from our select list
  for(var i=0; i<selected_journals.length; i++) {
    $("#journal-list option[value='" + selected_journals[i] + "']").remove();
  }

  if(queued) return new_data; // filter only and apply filters externally
  update(new_data); // update the database
}

// apply all filters all at once
function applyFilters(update_journals) {
  clearOverlay();
  // start by filtering by journal
  filter_data = filterJournals(map_data, true);
  drawJournalList();
  // draw our list of labels
  if(update_journals) drawSelectedJournals();
  // update our vis
  update(filter_data);
}

// clear the google maps overlay
function clearOverlay() {
  while(overlays.length > 0) {
    overlays.pop().setMap(null);
  }
}

// get a list of journals
function extractJournalList(documents) {
  var journal_list = [];
  journal_data = {};
  for(var i=0; i < documents.length-100; i++) {
    var journal_id = documents[i].journalid;
    if(!journal_list.includes(journal_id)) {
      journal_list.push(journal_id);
      journal_data[journal_id] = journal[journal_id];
    }
  }
  drawJournalList();
}
