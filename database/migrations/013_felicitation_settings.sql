CREATE TABLE IF NOT EXISTS felicitation_settings (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  hero_youtube_url VARCHAR(1000) NOT NULL DEFAULT '',
  updated_by BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_felicitation_settings_user
    FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO felicitation_settings (id, hero_youtube_url)
VALUES (1, '')
ON DUPLICATE KEY UPDATE id=VALUES(id);
