var rgb_stroke = "rgba(100,100,100,0.8)";
var rgb_highlight = function (entity_id) {
  if (hl_journal_id != null) {
    if ($.inArray(entity_id, journal_entity_map[hl_journal_id]) > 0) {
      return color_scale(hl_journal_id);
    }
  }
  return rgb_default;
};
var rgb_default = "rgba(155,155,155,0.8)";
