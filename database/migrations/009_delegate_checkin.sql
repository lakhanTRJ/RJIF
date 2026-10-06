ALTER TABLE admin_users
  MODIFY role ENUM('event_staff','editor','administrator') NOT NULL DEFAULT 'editor';

ALTER TABLE digital_passes
  ADD COLUMN checked_in_by BIGINT UNSIGNED NULL AFTER checked_in_at,
  ADD CONSTRAINT fk_pass_checked_in_by FOREIGN KEY (checked_in_by) REFERENCES admin_users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS pass_checkin_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pass_id BIGINT UNSIGNED NULL,
  admin_user_id BIGINT UNSIGNED NULL,
  result ENUM('checked_in','already_checked_in','cancelled','invalid') NOT NULL,
  scanned_value_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_checkin_pass FOREIGN KEY (pass_id) REFERENCES digital_passes(id) ON DELETE SET NULL,
  CONSTRAINT fk_checkin_admin FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_checkin_created (created_at),
  INDEX idx_checkin_pass (pass_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
