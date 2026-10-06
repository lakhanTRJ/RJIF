ALTER TABLE forum_settings
  ADD COLUMN post_agenda_banner_url VARCHAR(1000) NULL AFTER agenda_visible,
  ADD COLUMN post_agenda_banner_target VARCHAR(1000) NOT NULL DEFAULT '#passes' AFTER post_agenda_banner_url,
  ADD COLUMN post_agenda_banner_label VARCHAR(100) NOT NULL DEFAULT 'Register Now' AFTER post_agenda_banner_target,
  ADD COLUMN post_agenda_banner_visible BOOLEAN NOT NULL DEFAULT FALSE AFTER post_agenda_banner_label;

UPDATE forum_settings
SET post_agenda_banner_url='/reference/2026/09/India-Forum-banner_02.jpeg',
    post_agenda_banner_target='#passes',
    post_agenda_banner_label='Register Now',
    post_agenda_banner_visible=TRUE
WHERE forum='india';
