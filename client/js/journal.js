var journal = {};
var journal_data = {};
var author_data = {};
var journal_entity_map = {}
var entity_map = {};
var selected_journals = [];
var selected_authors = [];
var hl_journal_id = null;
var hl_pinned = false;
var selected_entity = [];
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
  highlightJournal();
}

// perform some sort of visual feedback on journal identities
function highlightJournal() {
    $(".filter-item").on("mouseover", function() {
      if(hl_pinned) return;
      hl_journal_id = $(this).attr("journal-id");
      update(filter_data);
    });

    $(".filter-item").on("mouseout", function() {
      if(hl_pinned) return;
      hl_journal_id = null;
      update(filter_data);
    });

    $(".filter-item").on("click", function() {
      if(($(this).attr("journal-id") == hl_journal_id) && hl_pinned) {
        $(".filter-item").removeClass("pinned");
        $(".filter-item").css("background-color", "");
        hl_pinned = false;
        hl_journal_id = null;
      } else {
        $(this).addClass("pinned");
        $(this).css("background-color", $(".filter-legend", this).css("background-color"));
        hl_pinned = true;
        hl_journal_id = $(this).attr("journal-id");
      }
      update(filter_data);
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
  if(selected_journals.length == 0) {
    $("#journal-filter i").show();
    $("#filter-list h2.journal").html("Selected Journals <a onclick='clearJournalFilters();'>clear</a>");
    return data;
  } else {
    $("#journal-filter i").hide();
    $("#filter-list h2.journal").html("Selected Journals (" + selected_journals.length + ") <a onclick='clearJournalFilters();'>clear</a>");
  }
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
  var entities = getEntityList(documents);
  var new_data = {"documents":documents, "entities":entities};
  // remove selected journals from our select list
  for(var i=0; i<selected_journals.length; i++) {
    $("#journal-list option[value='" + selected_journals[i] + "']").remove();
  }

  if(queued) return new_data; // filter only and apply filters externally
  update(new_data); // update the database
}

// apply all filters all at once
function applyFilters(update_selected) {
  clearOverlay();
  // start by filtering by journal
  var min_year = $("select[name='start-year']").val();
  var max_year = $("select[name='end-year']").val();
  filter_data = filterDate(map_data, true);
  filter_data = filterTitle(filter_data, true);
  filter_data = filterJournals(filter_data, true);
  drawJournalList();
  // then filter our author filter
  filter_data = filterAuthors(filter_data, true);
  var documents = filter_data.documents ? filter_data.documents : [];
  author_data = extractAuthorList(documents);
  drawAuthorList();
  // draw our list of labels
  if(update_selected) {
    drawSelectedJournals();
    drawSelectedAuthors();
  }
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
  for(var i=0; i < documents.length; i++) {
    var journal_id = documents[i].journalid;
    if(!journal_list.includes(journal_id)) {
      journal_list.push(journal_id);
      journal_data[journal_id] = journal[journal_id];
    }
  }
  drawJournalList();
}

// remove from selected journal list
function removeAuthorFilter(elem) {
  var $parent = $(elem).parent();
  var author_id = $parent.attr("author-id");
  $parent.remove();

  selected_authors = selected_authors.filter(function(item) {
    return item != author_id;
  });

  applyFilters(true);
}

// show all nodes within selected set of journal
function filterAuthors(data, queued) {
  // filter map_data with docs just in our selected journals
  selected_authors = selected_authors.concat($("select#author-list").val());
  if(selected_authors.length == 0) {
    $("#author-filter i").show();
    $("#filter-list h2.author").html("Selected Authors <a onclick='clearAuthorFilters();'>clear</a>");
    return data;
  } else {
    $("#author-filter i").hide();
    $("#filter-list h2.author").html("Selected Authors (" + selected_authors.length + ") <a onclick='clearAuthorFilters();'>clear</a>");
  }
  var entity_list = [];
  var documents = $.grep(data.documents, function(n, i) {
    if($.inArray(n.authorid+"", selected_authors) > -1) {
      if($.inArray(n.entityid+"", entity_list) == -1) {
        entity_list.push(n.entityid);
      }
      return true;
    }
    return false;
  });
  // filter links such that both documents are in selected journals
  var entities = getEntityList(documents);
  var new_data = {"documents":documents, "entities":entities};
  // remove selected journals from our select list
  for(var i=0; i<selected_authors.length; i++) {
    $("#author-list option[value='" + selected_authors[i] + "']").remove();
  }

  if(queued) return new_data; // filter only and apply filters externally
  update(new_data); // update the database
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
  highlightJournal();
}

// write the list of selected journals to the filter list
function drawSelectedAuthors() {
  for(var i=0; i<selected_authors.length; i++) {
    if($("#author-filter li[author-id='"
        + selected_authors[i] + "']").length > 0) {
      continue;
    }
    var id = selected_authors[i];
    var data = author_data[selected_authors[i]];
    var html = "<li class='filter-item' author-id='"
      + id + "'><span class='filter-legend' \
      style='background-color:" + color_scale(id)
      + ";'></span>" + data.name + " (" + data.count + ")\
      <span class='filter-close' \
      onclick='removeAuthorFilter(this)'>x</span></li>";
    $("ul#author-filter").append(html);
  }
}

// get a list of authors
function extractAuthorList(documents) {
  var author_list = [];
  var authors = {};
  for(var i=0; i < documents.length; i++) {
    var author_id = documents[i].authorid;
    if(!author_list.includes(author_id)) {
      author_list.push(author_id);
      authors[author_id] = {};
      authors[author_id].name = documents[i].author;
      authors[author_id].count = 1;
    } else {
      authors[author_id].count += 1;
    }
  }
  return authors;
}

// draw a list of authors for use in filtering
function drawAuthorList() {
  $("#author-list option").remove();
  var html = "";
  for(var key in author_data) {
    // check if we've already selected this author
    if($.inArray(key+"", selected_authors) > -1) {
      continue;
    }
    var j = author_data[key];
    var docs = j.count ? j.count : 0;
    html += "<option value='" + key + "'>"
      + j.name + " (" + docs + ")</option>";
  }

  $("#author-list").append(html);
}


function extractJournalEntity(documents) {
  for(var i=0; i<documents.length; i++) {
    var jid = documents[i].journalid;
    var eid = documents[i].entityid;
    if(journal_entity_map[jid]) {
      if($.inArray(eid, journal_entity_map[jid]) < 0) {
        journal_entity_map[jid].push(eid);
      }
    } else {
      journal_entity_map[jid] = [eid];
    }
    var links = documents[i].links;
    for(var j in links) {
      if(!entity_map[eid]) {
        entity_map[eid] = [];
      }
      if($.inArray(links[j], entity_map[eid]) == -1) {
        entity_map[eid].push(links[j]);
      }
    }
  }
}

function extractDateRange(documents) {
  var min_year = 9999;
  var max_year = 0;
  for(var i=0; i<documents.length; i++) {
    if(documents[i].year < min_year) min_year = documents[i].year;
    if(documents[i].year > max_year) max_year = documents[i].year;
  }
  populateDateRange(min_year, max_year);
  $("select[name='start-year'], select[name='end-year']").change(function() {
    applyFilters(false);
  });
}

function populateDateRange(min, max) {
  var slider = $("#filter-date")[0];
  noUiSlider.create(slider, {
      start: [min, max],
      connect: true,
      range: {
          'min': parseInt(min),
          'max': parseInt(max)
      },
      tooltips: [wNumb({decimals: 0}), wNumb({decimals: 0})]
  });
  $("#filter-date")[0].noUiSlider.on("update", function() {
    applyFilters(false);
  });
}

function filterDate(data, queued) {
  var values = $("#filter-date")[0].noUiSlider.get();
  var min_year = parseInt(values[0]);
  var max_year = parseInt(values[1]);
  var entity_list = [];
  var documents = data.documents.filter(function(n) {
    if(n.year >= min_year && n.year <= max_year) {
      if($.inArray(n.entityid, entity_list) == -1) {
        entity_list.push(n.entityid);
      }
      return true
    }
    return false;
  });
  $("#filter-list h2.year").html("Year Range (" + min_year + "-" + max_year + ")");
  // filter links such that both documents are in selected journals
  var entities = getEntityList(documents);
  var new_data = {"documents":documents, "entities":entities};
  if(queued) return new_data; // filter only and apply filters externally
  update(new_data); // update the database
}

function filterTitle(data, queued) {
  var keyword = $("#filter-title").val().toLowerCase();
  var entity_list = [];
  var documents = data.documents.filter(function(n) {
    if(n.title.toLowerCase().indexOf(keyword) != -1) {
      if($.inArray(n.entityid, entity_list) == -1) {
        entity_list.push(n.entityid);
      }
      return true
    }
    return false;
  });
  var entities = getEntityList(documents);
  var new_data = {"documents":documents, "entities":entities};
  if(queued) return new_data; // filter only and apply filters externally
  update(new_data); // update the database
}

function getEntityList(documents) {
  var entities = {}
  for(var i in documents) {
    var eid = documents[i].entityid;
    var links = documents[i].links;
    entities[eid] = map_data.entities[eid];
    for(var j in links) {
      var lid = links[j];
      if(!entities[lid]) {
        entities[lid] = map_data.entities[lid];
      }
    }
  }
  return entities;
}

function clearJournalFilters() {
  $(".filter-item").removeClass("pinned");
  $(".filter-item").css("background-color", "");
  hl_pinned = false;
  hl_journal_id = null;
  $("#journal-filter .filter-item").remove();
  selected_journals = [];
  applyFilters(false);
}

function clearAuthorFilters() {
  $("#author-filter .filter-item").remove();
  selected_authors = [];
  applyFilters(false);
}
