ALTER TABLE forum_settings
  ADD COLUMN event_date VARCHAR(255) NOT NULL DEFAULT '7th Jan 2027' AFTER content_youtube_url,
  ADD COLUMN event_location VARCHAR(500) NOT NULL DEFAULT 'Grand Hyatt Mumbai' AFTER event_date,
  ADD COLUMN overview_stats TEXT NULL AFTER event_location;

UPDATE forum_settings SET overview_stats='[{"number":"12","label":"Years","caption":"Sharing Knowledge"},{"number":"50+","label":"Speakers","caption":""},{"number":"250+","label":"Attendees","caption":""},{"number":"40+","label":"Exhibitors","caption":""},{"number":"480+","label":"Minutes of Learning","caption":""}]' WHERE forum='india';
UPDATE forum_settings SET overview_stats='[{"number":"35+","label":"Speakers","caption":""},{"number":"150+","label":"Attendees","caption":""},{"number":"30+","label":"Exhibitors","caption":""},{"number":"480+","label":"Minutes of Learning","caption":""}]' WHERE forum='south';
