var journal_data = {};
var selected_journals = [];
d3.json("/journal", function(error, data) {
  journal_data = data;
  // drawJournalList();
});

// draw the journal select list
function drawJournalList() {
  $("#journal-list option").remove();
  var html = "";

  for(var i = 0; i < journal_data.length; i++) {
    // check if we've already selected this journal
    if($.inArray(journal_data[i].id+"", selected_journals) > -1) {
      continue;
    }
    var journal_id = journal_data[i].id;
    var journal_title = journal_data[i].title;
    var docs = journal_data[i].count ? journal_data[i].count : 0;
    html += "<option value='" + journal_id + "'>"
      + journal_title + " (" + docs + ")</option>";
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
    var data = getJournal(selected_journals[i]);
    var html = "<li class='filter-item' journal-id='"
      + data.id + "'><span class='filter-legend' \
      style='background-color:" + color_scale(data.id)
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

// show all nodes within a journal
function showJournalLinks(journal_id) {
  $("svg.marker[journal-id='" + journal_id + "']").each(function() {
    $("svg.links[doc-source='" + $(this).attr("doc-id") + "']").each(function() {
      showLinks($(this).attr("doc-target"));
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

  filterJournals(false);
  drawJournalList();
}

// show all nodes within selected set of journal
function filterJournals(update_list) {
  while(overlays.length > 0) {
    overlays.pop().setMap(null);
  }
  // filter map_data with docs just in our selected journals
  selected_journals = selected_journals.concat($("select#journal-list").val());
  var doc_list = [];
  var documents = $.grep(map_data.documents, function(n, i) {
    if($.inArray(n.journalid+"", selected_journals) > -1) {
      doc_list.push(n.documentid);
      return true
    }
    return false;
  });

  // filter links such that both documents are in selected journals
  var links = [];
  for(var i=0; i < map_data.links.length; i++) {
    if($.inArray(map_data.links[i].source, doc_list) > -1
      && $.inArray(map_data.links[i].target, doc_list) > -1) {
        links.push(map_data.links[i]);
    }
  }
  var new_data = {"documents":documents, "links":links};

  update(new_data); // update the database
  // draw our list of labels
  if(update_list) drawSelectedJournals();
  // remove selected journals from our select list
  for(var i=0; i<selected_journals.length; i++) {
    $("#journal-list option[value='" + selected_journals[i] + "']").remove();
  }
}

// get the meta data for a journal given an id
function getJournal(id) {
  for(var i=0; i < journal_data.length; i++) {
    if(id == journal_data[i].id) {
      return journal_data[i];
    }
  }
  return { "id":"", "title":"" };
}
