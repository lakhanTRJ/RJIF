CREATE TABLE magazine_subscribers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(200) NOT NULL,
  company VARCHAR(200) NOT NULL,
  mobile VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  valid_until DATE NULL,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE subscriber_otp_challenges (
  id CHAR(36) PRIMARY KEY,
  subscriber_id BIGINT UNSIGNED NULL,
  channel ENUM('email','whatsapp') NOT NULL,
  contact_hash CHAR(64) NOT NULL,
  session_hash CHAR(64) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  sent_at DATETIME NULL,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_subscriber_otp_contact (contact_hash,created_at),
  INDEX idx_subscriber_otp_expiry (expires_at),
  FOREIGN KEY (subscriber_id) REFERENCES magazine_subscribers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE award_applications
  ADD COLUMN subscriber_id BIGINT UNSIGNED NULL,
  ADD COLUMN subscriber_channel ENUM('email','whatsapp') NULL,
  ADD COLUMN subscriber_contact_hash CHAR(64) NULL,
  ADD COLUMN subscriber_verified_at DATETIME NULL,
  ADD CONSTRAINT fk_award_subscriber FOREIGN KEY (subscriber_id) REFERENCES magazine_subscribers(id);
