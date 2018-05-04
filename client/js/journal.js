
d3.json("/journal", function(error, data) {
  var html = "<div id='journal-widget' class='tool-box-widget'>\
    <h2>Journals</h2>\
    <select id='journal-list' size='10' multiple>";
  for(var i = 0; i < data.length; i++) {
    var journal_id = data[i].id;
    var journal_title = data[i].title;
    html += "<option value='" + journal_id + "'>" + journal_title + "</option>";
  }
  html += "</select><div class='ui vertical segment right aligned'>\
    <button>Clear</button>\
    <button onclick='filterJournals();'>Filter</button>\
    </div></div>";

  $("#tool-box").append(html);
});
