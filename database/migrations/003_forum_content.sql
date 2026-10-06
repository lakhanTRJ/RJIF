CREATE TABLE IF NOT EXISTS forum_settings (
  forum ENUM('india','south') PRIMARY KEY,
  speaker_heading VARCHAR(255) NOT NULL DEFAULT 'Speakers 2026',
  hero_youtube_url VARCHAR(1000),
  content_youtube_url VARCHAR(1000),
  quote_text TEXT NOT NULL,
  quote_visible BOOLEAN NOT NULL DEFAULT TRUE,
  agenda_visible BOOLEAN NOT NULL DEFAULT TRUE,
  passes_visible BOOLEAN NOT NULL DEFAULT TRUE,
  pass_columns TINYINT UNSIGNED NOT NULL DEFAULT 4,
  gallery_heading VARCHAR(255) NOT NULL DEFAULT 'Previous Event Glimpses',
  gallery_visible BOOLEAN NOT NULL DEFAULT TRUE,
  gallery_target_url VARCHAR(1000) NOT NULL DEFAULT '/previous-edition-highlights/',
  footer_tagline VARCHAR(500) NOT NULL DEFAULT 'A Knowledge and Networking Platform where Forward-Thinking Jewellers Meet!',
  footer_copyright VARCHAR(500) NOT NULL DEFAULT 'Copyright © 2025 Retail Jeweller. All Rights Reserved',
  linkedin_url VARCHAR(1000),
  instagram_url VARCHAR(1000),
  facebook_url VARCHAR(1000),
  x_url VARCHAR(1000),
  youtube_url VARCHAR(1000),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS speakers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  forum ENUM('india','south') NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(1000),
  image_url VARCHAR(1000),
  event_year SMALLINT UNSIGNED,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_speaker_forum_name (forum,name),
  INDEX idx_speaker_public (forum,is_published,is_featured,sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agenda_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  forum ENUM('india','south') NOT NULL,
  number VARCHAR(20),
  title VARCHAR(500) NOT NULL,
  subtitle VARCHAR(1000),
  body TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_agenda_public (forum,is_visible,sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gallery_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  forum ENUM('india','south') NOT NULL,
  image_url VARCHAR(1000) NOT NULL,
  image_alt VARCHAR(500) NOT NULL,
  target_url VARCHAR(1000),
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_gallery_public (forum,is_visible,sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO forum_settings
  (forum,speaker_heading,hero_youtube_url,content_youtube_url,quote_text,pass_columns)
VALUES
  ('india','Speakers 2026','https://youtu.be/B3aomEHlo6Q','https://www.youtube.com/embed/gJPEgWkEB38','Where strategy is as precious as the stones',4),
  ('south','Speakers 2026','https://youtu.be/40EdADsjqcM','https://youtu.be/z13yd2PRQ74','Where the jewellery capital of India shapes its next capital idea Join The Discussion.',3)
ON DUPLICATE KEY UPDATE forum=VALUES(forum);
