ALTER TABLE admin_users
  ADD COLUMN last_login_at TIMESTAMP NULL AFTER is_active;

ALTER TABLE commerce_products
  ADD COLUMN complimentary_token_hash CHAR(64) NULL AFTER is_active,
  ADD COLUMN redemption_limit INT UNSIGNED NULL AFTER complimentary_token_hash,
  ADD COLUMN redemption_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER redemption_limit,
  ADD COLUMN expires_at TIMESTAMP NULL AFTER redemption_count,
  ADD COLUMN inventory_limit INT UNSIGNED NULL AFTER expires_at;

ALTER TABLE commerce_orders
  ADD COLUMN idempotency_key CHAR(64) NULL AFTER public_id,
  ADD COLUMN award_application_id BIGINT UNSIGNED NULL AFTER product_id,
  ADD COLUMN policy_version VARCHAR(40) NOT NULL DEFAULT '2026-10-06' AFTER consented_at,
  ADD UNIQUE KEY uq_order_idempotency (idempotency_key),
  ADD INDEX idx_order_award_application (award_application_id),
  ADD CONSTRAINT fk_order_award_application FOREIGN KEY (award_application_id) REFERENCES award_applications(id) ON DELETE SET NULL;

ALTER TABLE payment_events
  ADD COLUMN processing_status ENUM('received','processed','failed') NOT NULL DEFAULT 'received' AFTER payload,
  ADD COLUMN attempt_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER processing_status,
  ADD COLUMN last_error VARCHAR(1000) NULL AFTER attempt_count;

CREATE TABLE IF NOT EXISTS email_jobs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kind ENUM('delegate_passes','account_link','form_notification') NOT NULL,
  dedupe_key VARCHAR(190) NULL UNIQUE,
  order_id BIGINT UNSIGNED NULL,
  recipient VARCHAR(255) NOT NULL,
  payload JSON NULL,
  status ENUM('pending','processing','sent','failed') NOT NULL DEFAULT 'pending',
  attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_error VARCHAR(1000) NULL,
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_email_job_order FOREIGN KEY (order_id) REFERENCES commerce_orders(id) ON DELETE CASCADE,
  INDEX idx_email_jobs_ready (status,next_attempt_at),
  INDEX idx_email_jobs_order (order_id,kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_user_id BIGINT UNSIGNED NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(120) NOT NULL,
  entity_id VARCHAR(120) NULL,
  metadata JSON NULL,
  ip_hash CHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_admin FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_audit_entity (entity_type,entity_id,created_at),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Existing zero-price products predate secure redemption tokens. Keep their
-- records for reporting, but require an administrator to create a secured
-- replacement before they can be redeemed again.
UPDATE commerce_products
SET is_active=0
WHERE sale_price_paise=0 AND complimentary_token_hash IS NULL;
