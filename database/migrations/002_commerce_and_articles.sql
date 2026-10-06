CREATE TABLE IF NOT EXISTS commerce_products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  kind ENUM('delegate_pass','award_fee') NOT NULL,
  forum ENUM('india','south','awards') NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  regular_price_paise INT UNSIGNED NULL,
  sale_price_paise INT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  member_count INT UNSIGNED NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_public (forum, kind, is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS commerce_orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL UNIQUE,
  product_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  subtotal_paise INT UNSIGNED NOT NULL,
  tax_paise INT UNSIGNED NOT NULL DEFAULT 0,
  total_paise INT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  customer_name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  gstin VARCHAR(40),
  billing_address TEXT NOT NULL,
  status ENUM('pending','payment_created','paid','failed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  provider_order_id VARCHAR(255),
  provider_payment_id VARCHAR(255),
  consented_at TIMESTAMP NOT NULL,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_product FOREIGN KEY (product_id) REFERENCES commerce_products(id) ON DELETE RESTRICT,
  INDEX idx_orders_status_created (status, created_at),
  INDEX idx_orders_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  provider_event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(120) NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
  payload JSON NOT NULL,
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_attendees (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  attendee_number INT UNSIGNED NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attendee_order FOREIGN KEY (order_id) REFERENCES commerce_orders(id) ON DELETE CASCADE,
  UNIQUE KEY uq_order_attendee_number (order_id, attendee_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoices (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL UNIQUE,
  invoice_number VARCHAR(100) NOT NULL UNIQUE,
  legal_name VARCHAR(255) NOT NULL,
  legal_address TEXT NOT NULL,
  supplier_gstin VARCHAR(40),
  customer_gstin VARCHAR(40),
  document_storage_key VARCHAR(1000),
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoice_order FOREIGN KEY (order_id) REFERENCES commerce_orders(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS digital_passes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  attendee_id BIGINT UNSIGNED NULL,
  pass_number VARCHAR(100) NOT NULL UNIQUE,
  qr_token_hash CHAR(64) NOT NULL UNIQUE,
  status ENUM('active','checked_in','cancelled') NOT NULL DEFAULT 'active',
  checked_in_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pass_order FOREIGN KEY (order_id) REFERENCES commerce_orders(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pass_attendee FOREIGN KEY (attendee_id) REFERENCES order_attendees(id) ON DELETE SET NULL,
  INDEX idx_pass_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS articles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  excerpt TEXT,
  body_html MEDIUMTEXT NOT NULL,
  featured_image_url VARCHAR(1000),
  seo_title VARCHAR(255),
  seo_description VARCHAR(500),
  status ENUM('draft','scheduled','published','archived') NOT NULL DEFAULT 'draft',
  publish_at TIMESTAMP NULL,
  author_id BIGINT UNSIGNED NULL,
  published_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_articles_author FOREIGN KEY (author_id) REFERENCES admin_users(id) ON DELETE SET NULL,
  CONSTRAINT fk_articles_publisher FOREIGN KEY (published_by) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_articles_publication (status, publish_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS article_revisions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(500) NOT NULL,
  excerpt TEXT,
  body_html MEDIUMTEXT NOT NULL,
  changed_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_revision_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  CONSTRAINT fk_revision_user FOREIGN KEY (changed_by) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_revisions_article (article_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
