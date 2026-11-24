ALTER TABLE forum_settings ADD COLUMN speaker_event_year SMALLINT UNSIGNED NULL;
UPDATE forum_settings SET speaker_event_year=2027 WHERE forum='india';
ALTER TABLE speakers DROP INDEX uq_speaker_forum_name,
  ADD UNIQUE KEY uq_speaker_forum_year_name (forum,event_year,name);
