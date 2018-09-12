var rgb_stroke = "rgba(155,155,155,0.5)";
var rgb_highlight = function(entity_id) {
  if(hl_journal_id != null) {
    if($.inArray(entity_id, journal_entity_map[hl_journal_id]) > 0) {
      return color_scale(hl_journal_id);
    }
  }
  return rgb_default;
};
var rgb_default = "rgba(200,200,200,0.5)";
