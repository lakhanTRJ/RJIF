ALTER TABLE commerce_orders
  ADD COLUMN archived_at DATETIME NULL,
  ADD COLUMN duplicate_of_order_id BIGINT UNSIGNED NULL,
  ADD CONSTRAINT fk_order_duplicate FOREIGN KEY (duplicate_of_order_id) REFERENCES commerce_orders(id);
ALTER TABLE award_applications
  ADD COLUMN archived_at DATETIME NULL,
  ADD COLUMN duplicate_of_application_id BIGINT UNSIGNED NULL,
  ADD CONSTRAINT fk_award_duplicate FOREIGN KEY (duplicate_of_application_id) REFERENCES award_applications(id);
