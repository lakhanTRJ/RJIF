CREATE TABLE IF NOT EXISTS award_settings (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  content JSON NOT NULL,
  updated_by BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_award_settings_user FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS award_applications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL UNIQUE,
  categories JSON NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  company VARCHAR(200) NOT NULL,
  mobile VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  coordinator_name VARCHAR(200) NOT NULL,
  coordinator_number VARCHAR(50) NOT NULL,
  gstin VARCHAR(30) NULL,
  city VARCHAR(120) NOT NULL,
  state VARCHAR(120) NOT NULL,
  billing_address TEXT NULL,
  status ENUM('pending','payment_pending','paid','cancelled') NOT NULL DEFAULT 'payment_pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_award_applications_status_created (status, created_at),
  INDEX idx_award_applications_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
