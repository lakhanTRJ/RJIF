ALTER TABLE forum_settings
  ADD COLUMN quote_banner_url VARCHAR(1000) NULL AFTER quote_text,
  ADD COLUMN quote_banner_target VARCHAR(1000) NOT NULL DEFAULT '#passes' AFTER quote_banner_url;

UPDATE forum_settings
SET quote_banner_url='/reference/2026/09/retail-reimagined-india-forum-27.png',
    quote_banner_target='#passes',
    quote_visible=TRUE
WHERE forum='india';
