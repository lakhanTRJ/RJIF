ALTER TABLE highlight_videos
  ADD COLUMN forum ENUM('india','south') NOT NULL DEFAULT 'india' AFTER id,
  ADD COLUMN event_year SMALLINT UNSIGNED NOT NULL DEFAULT 2026 AFTER section,
  ADD INDEX idx_highlight_forum_year (forum,event_year,is_visible,sort_order);

ALTER TABLE gallery_items
  ADD COLUMN event_year SMALLINT UNSIGNED NOT NULL DEFAULT 2026 AFTER forum,
  ADD INDEX idx_gallery_forum_year (forum,event_year,is_visible,sort_order);

UPDATE gallery_items
SET target_url='/previous-edition-highlights-south/'
WHERE forum='south' AND target_url='/previous-edition-highlights/';
