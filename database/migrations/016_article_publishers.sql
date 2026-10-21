ALTER TABLE admin_users
  MODIFY role ENUM('event_staff','editor','administrator','article_publisher') NOT NULL DEFAULT 'editor',
  ADD COLUMN auth_version INT UNSIGNED NOT NULL DEFAULT 0;
